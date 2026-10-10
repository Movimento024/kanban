-- Movimento 024 — esquema base: enums, tabelas, funções utilitárias.

-- ============================================================
-- Enums
-- ============================================================
create type public.papel_usuario as enum ('admin', 'lider');
create type public.regiao_pessoa as enum ('SP', 'Nordeste', 'SP_Nordeste');
create type public.regiao_item as enum ('SP', 'Nordeste', 'Nacional');
create type public.layout_frente as enum ('linha_do_tempo', 'cadencia', 'lista');
create type public.status_item as enum ('ideia', 'em_definicao', 'confirmado', 'realizado', 'cancelado');
create type public.precisao_data as enum ('exata', 'intervalo', 'mes', 'periodo', 'a_definir');
create type public.periodo_ano as enum ('s1', 's2', 't1', 't2', 't3', 't4', 'meio_ano');
create type public.recorrencia as enum ('nenhuma', 'semanal', 'quinzenal', 'mensal');
create type public.papel_atribuicao as enum ('responsavel', 'apoio');
create type public.status_decisao as enum ('aberta', 'decidida');
create type public.acao_atividade as enum (
  'criou', 'editou', 'atribuiu', 'desatribuiu', 'concluiu', 'reabriu',
  'decidiu', 'reabriu_decisao', 'arquivou', 'restaurou', 'excluiu'
);

-- ============================================================
-- Utilitário: updated_at automático
-- ============================================================
create function public.tocar_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ============================================================
-- Perfis (1:1 com auth.users)
-- ============================================================
create table public.perfis (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null check (length(trim(nome)) > 0),
  email text not null unique,
  iniciais text not null check (length(iniciais) between 1 and 3),
  regiao public.regiao_pessoa not null,
  papel public.papel_usuario not null default 'lider',
  ativo boolean not null default true,
  precisa_trocar_senha boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger perfis_updated_at before update on public.perfis
  for each row execute function public.tocar_updated_at();

-- Funções de permissão (security definer para não recursar no RLS de perfis)
create function public.eh_ativo()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.perfis p where p.id = auth.uid() and p.ativo
  );
$$;

create function public.eh_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.perfis p
    where p.id = auth.uid() and p.ativo and p.papel = 'admin'
  );
$$;

-- ============================================================
-- Frentes
-- ============================================================
create table public.frentes (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (length(trim(nome)) > 0),
  descricao text,
  cor text not null,
  icone text not null,
  ordem integer not null default 0,
  layout public.layout_frente not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid default auth.uid() references public.perfis (id) on delete set null,
  archived_at timestamptz
);

create trigger frentes_updated_at before update on public.frentes
  for each row execute function public.tocar_updated_at();

-- ============================================================
-- Itens
-- ============================================================
create table public.itens (
  id uuid primary key default gen_random_uuid(),
  frente_id uuid not null references public.frentes (id) on delete restrict,
  titulo text not null check (length(trim(titulo)) > 0),
  descricao text,
  regiao public.regiao_item not null,
  local text,
  status public.status_item not null default 'ideia',

  -- Data com precisão variável. data_inicio/data_fim são sempre normalizadas
  -- para o intervalo coberto (ver normalizar_data_item).
  data_precisao public.precisao_data not null default 'a_definir',
  data_inicio date,
  data_fim date,
  data_hora time,
  data_periodo public.periodo_ano,
  data_texto text,

  recorrencia public.recorrencia not null default 'nenhuma',
  recorrencia_dia_semana smallint check (recorrencia_dia_semana between 0 and 6),
  recorrencia_estreia date,
  recorrencia_texto text,
  canais text[] not null default '{}',

  ordem integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid default auth.uid() references public.perfis (id) on delete set null,
  archived_at timestamptz,

  constraint itens_data_coerente check (
    (data_precisao = 'a_definir' and data_inicio is null and data_fim is null)
    or (data_precisao <> 'a_definir' and data_inicio is not null and data_fim is not null
        and data_fim >= data_inicio)
  ),
  constraint itens_periodo_coerente check (
    (data_precisao = 'periodo') = (data_periodo is not null)
  ),
  constraint itens_hora_coerente check (
    data_hora is null or data_precisao = 'exata'
  )
);

create index itens_frente_idx on public.itens (frente_id, ordem);
create index itens_data_idx on public.itens (data_inicio);

-- Normaliza data_inicio/data_fim a partir da precisão.
-- mes: qualquer dia do mês em data_inicio → mês inteiro.
-- periodo: o ano é lido de data_inicio; o intervalo vem de data_periodo.
create function public.normalizar_data_item()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  ano integer;
begin
  case new.data_precisao
    when 'a_definir' then
      new.data_inicio := null;
      new.data_fim := null;
      new.data_hora := null;
      new.data_periodo := null;
    when 'exata' then
      new.data_fim := new.data_inicio;
      new.data_periodo := null;
    when 'intervalo' then
      new.data_hora := null;
      new.data_periodo := null;
    when 'mes' then
      if new.data_inicio is not null then
        new.data_inicio := date_trunc('month', new.data_inicio)::date;
        new.data_fim := (new.data_inicio + interval '1 month - 1 day')::date;
      end if;
      new.data_hora := null;
      new.data_periodo := null;
    when 'periodo' then
      new.data_hora := null;
      if new.data_inicio is not null and new.data_periodo is not null then
        ano := extract(year from new.data_inicio)::integer;
        case new.data_periodo
          when 's1' then new.data_inicio := make_date(ano, 1, 1);  new.data_fim := make_date(ano, 6, 30);
          when 's2' then new.data_inicio := make_date(ano, 7, 1);  new.data_fim := make_date(ano, 12, 31);
          when 't1' then new.data_inicio := make_date(ano, 1, 1);  new.data_fim := make_date(ano, 3, 31);
          when 't2' then new.data_inicio := make_date(ano, 4, 1);  new.data_fim := make_date(ano, 6, 30);
          when 't3' then new.data_inicio := make_date(ano, 7, 1);  new.data_fim := make_date(ano, 9, 30);
          when 't4' then new.data_inicio := make_date(ano, 10, 1); new.data_fim := make_date(ano, 12, 31);
          when 'meio_ano' then new.data_inicio := make_date(ano, 6, 1); new.data_fim := make_date(ano, 8, 31);
        end case;
      end if;
  end case;
  return new;
end;
$$;

create trigger itens_normalizar_data before insert or update on public.itens
  for each row execute function public.normalizar_data_item();

create trigger itens_updated_at before update on public.itens
  for each row execute function public.tocar_updated_at();

-- ============================================================
-- Atribuições (pessoa ↔ item)
-- ============================================================
create table public.atribuicoes (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.itens (id) on delete cascade,
  pessoa_id uuid not null references public.perfis (id) on delete cascade,
  papel public.papel_atribuicao not null,
  atribuido_por uuid default auth.uid() references public.perfis (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (item_id, pessoa_id)
);

-- No máximo um responsável por item
create unique index atribuicoes_um_responsavel on public.atribuicoes (item_id)
  where papel = 'responsavel';
create index atribuicoes_pessoa_idx on public.atribuicoes (pessoa_id);

-- ============================================================
-- Tarefas (com subtarefas de 1 nível)
-- ============================================================
create table public.tarefas (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.itens (id) on delete cascade,
  parent_id uuid references public.tarefas (id) on delete cascade,
  titulo text not null check (length(trim(titulo)) > 0),
  concluida boolean not null default false,
  concluida_em timestamptz,
  concluida_por uuid references public.perfis (id) on delete set null,
  responsavel_id uuid references public.perfis (id) on delete set null,
  prazo date,
  ordem integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid default auth.uid() references public.perfis (id) on delete set null,
  archived_at timestamptz,
  check (parent_id is distinct from id)
);

create index tarefas_item_idx on public.tarefas (item_id, ordem);
create index tarefas_responsavel_idx on public.tarefas (responsavel_id);

create function public.validar_tarefa()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  pai record;
begin
  if new.parent_id is not null then
    select t.item_id, t.parent_id into pai from public.tarefas t where t.id = new.parent_id;
    if pai.parent_id is not null then
      raise exception 'Subtarefas só podem ter um nível.' using errcode = '23514';
    end if;
    if pai.item_id <> new.item_id then
      raise exception 'A subtarefa precisa pertencer ao mesmo item da tarefa.' using errcode = '23514';
    end if;
    if tg_op = 'UPDATE' and exists (select 1 from public.tarefas f where f.parent_id = new.id) then
      raise exception 'Uma tarefa com subtarefas não pode virar subtarefa.' using errcode = '23514';
    end if;
  end if;

  if new.concluida and (tg_op = 'INSERT' or not old.concluida) then
    new.concluida_em := now();
    new.concluida_por := auth.uid();
  elsif not new.concluida then
    new.concluida_em := null;
    new.concluida_por := null;
  end if;
  return new;
end;
$$;

create trigger tarefas_validar before insert or update on public.tarefas
  for each row execute function public.validar_tarefa();

create trigger tarefas_updated_at before update on public.tarefas
  for each row execute function public.tocar_updated_at();

-- ============================================================
-- Decisões e opções
-- ============================================================
create table public.decisoes (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.itens (id) on delete cascade,
  pergunta text not null check (length(trim(pergunta)) > 0),
  status public.status_decisao not null default 'aberta',
  opcao_escolhida_id uuid,
  decidida_por uuid references public.perfis (id) on delete set null,
  decidida_em timestamptz,
  prazo date,
  campo_relacionado text check (campo_relacionado in ('local', 'data')),
  ordem integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid default auth.uid() references public.perfis (id) on delete set null,
  archived_at timestamptz,
  constraint decisoes_status_coerente check (
    status = 'aberta' or opcao_escolhida_id is not null
  )
);

create index decisoes_item_idx on public.decisoes (item_id, ordem);

create table public.decisao_opcoes (
  id uuid primary key default gen_random_uuid(),
  decisao_id uuid not null references public.decisoes (id) on delete cascade,
  texto text not null check (length(trim(texto)) > 0),
  ordem integer not null default 0,
  created_at timestamptz not null default now(),
  created_by uuid default auth.uid() references public.perfis (id) on delete set null,
  archived_at timestamptz
);

create index decisao_opcoes_decisao_idx on public.decisao_opcoes (decisao_id, ordem);

alter table public.decisoes
  add constraint decisoes_opcao_escolhida_fk
  foreign key (opcao_escolhida_id) references public.decisao_opcoes (id);

create function public.validar_decisao()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.opcao_escolhida_id is not null and not exists (
    select 1 from public.decisao_opcoes o
    where o.id = new.opcao_escolhida_id and o.decisao_id = new.id
  ) then
    raise exception 'A opção escolhida não pertence a esta decisão.' using errcode = '23514';
  end if;

  if new.status = 'decidida' and (tg_op = 'INSERT' or old.status = 'aberta'
      or old.opcao_escolhida_id is distinct from new.opcao_escolhida_id) then
    new.decidida_em := now();
    new.decidida_por := auth.uid();
  elsif new.status = 'aberta' then
    new.opcao_escolhida_id := null;
    new.decidida_em := null;
    new.decidida_por := null;
  end if;
  return new;
end;
$$;

create trigger decisoes_validar before insert or update on public.decisoes
  for each row execute function public.validar_decisao();

create trigger decisoes_updated_at before update on public.decisoes
  for each row execute function public.tocar_updated_at();

-- ============================================================
-- Notas
-- ============================================================
create table public.notas (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.itens (id) on delete cascade,
  autor_id uuid default auth.uid() references public.perfis (id) on delete set null,
  texto text not null check (length(trim(texto)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create index notas_item_idx on public.notas (item_id, created_at);

create trigger notas_updated_at before update on public.notas
  for each row execute function public.tocar_updated_at();

-- ============================================================
-- Configurações
-- ============================================================
create table public.configuracoes (
  chave text primary key,
  valor jsonb not null,
  updated_at timestamptz not null default now()
);

create trigger configuracoes_updated_at before update on public.configuracoes
  for each row execute function public.tocar_updated_at();

insert into public.configuracoes (chave, valor) values ('limite_sobrecarga', '5');
