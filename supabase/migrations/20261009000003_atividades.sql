-- Movimento 024 — histórico de atividades, gravado por triggers.
--
-- Cada INSERT/UPDATE/DELETE nas tabelas de domínio gera uma linha. Em UPDATE,
-- valor_anterior/valor_novo guardam só os campos alterados. item_id/frente_id
-- não têm FK para o histórico sobreviver a exclusões; "contexto" guarda um
-- retrato (títulos, nomes) para montar a frase mesmo depois que algo sumiu.

create table public.atividades (
  id bigint generated always as identity primary key,
  ator_id uuid references public.perfis (id) on delete set null,
  acao public.acao_atividade not null,
  entidade text not null,
  entidade_id uuid not null,
  item_id uuid,
  frente_id uuid,
  valor_anterior jsonb,
  valor_novo jsonb,
  contexto jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index atividades_created_idx on public.atividades (created_at desc);
create index atividades_item_idx on public.atividades (item_id, created_at desc);
create index atividades_frente_idx on public.atividades (frente_id, created_at desc);
create index atividades_ator_idx on public.atividades (ator_id, created_at desc);

alter table public.atividades enable row level security;
create policy atividades_select on public.atividades
  for select to authenticated using ((select public.eh_ativo()));
-- Sem políticas de escrita: só os triggers (security definer) gravam.

create function public.registrar_atividade()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  linha jsonb;
  anterior jsonb;
  diff_antes jsonb := '{}';
  diff_depois jsonb := '{}';
  chave text;
  v_acao public.acao_atividade;
  v_entidade text;
  v_item_id uuid;
  v_frente_id uuid;
  v_contexto jsonb := '{}';
  v_item record;
  ignorar constant text[] := array['updated_at', 'ordem', 'concluida_em', 'concluida_por',
                                   'decidida_em', 'decidida_por'];
begin
  if tg_op = 'DELETE' then
    linha := to_jsonb(old);
  else
    linha := to_jsonb(new);
  end if;

  v_entidade := case tg_table_name
    when 'frentes' then 'frente'
    when 'itens' then 'item'
    when 'tarefas' then 'tarefa'
    when 'decisoes' then 'decisao'
    when 'decisao_opcoes' then 'opcao'
    when 'notas' then 'nota'
    when 'atribuicoes' then 'atribuicao'
  end;

  -- Descobre item e frente
  if tg_table_name = 'frentes' then
    v_frente_id := (linha ->> 'id')::uuid;
    v_contexto := jsonb_build_object('frente', linha ->> 'nome');
  elsif tg_table_name = 'itens' then
    v_item_id := (linha ->> 'id')::uuid;
    v_frente_id := (linha ->> 'frente_id')::uuid;
    v_contexto := jsonb_build_object('item', linha ->> 'titulo');
  else
    if tg_table_name = 'decisao_opcoes' then
      select d.item_id into v_item_id from public.decisoes d where d.id = (linha ->> 'decisao_id')::uuid;
      -- Exclusão em cascata da decisão: não registra cada opção.
      if v_item_id is null then
        return null;
      end if;
      v_contexto := jsonb_build_object('opcao', linha ->> 'texto',
        'decisao', (select d.pergunta from public.decisoes d where d.id = (linha ->> 'decisao_id')::uuid));
    else
      v_item_id := (linha ->> 'item_id')::uuid;
    end if;

    select i.titulo, i.frente_id into v_item from public.itens i where i.id = v_item_id;
    -- Exclusão em cascata do item: o próprio item já registra a exclusão.
    if not found then
      return null;
    end if;
    v_frente_id := v_item.frente_id;
    v_contexto := v_contexto || jsonb_build_object('item', v_item.titulo);

    case tg_table_name
      when 'tarefas' then
        v_contexto := v_contexto || jsonb_build_object('tarefa', linha ->> 'titulo');
      when 'decisoes' then
        v_contexto := v_contexto || jsonb_build_object('decisao', linha ->> 'pergunta');
      when 'notas' then
        v_contexto := v_contexto || jsonb_build_object('nota', left(linha ->> 'texto', 120));
      when 'atribuicoes' then
        v_contexto := v_contexto || jsonb_build_object(
          'pessoa', (select p.nome from public.perfis p where p.id = (linha ->> 'pessoa_id')::uuid),
          'pessoa_id', linha ->> 'pessoa_id',
          'papel', linha ->> 'papel');
      else
        null;
    end case;
  end if;

  -- Ação
  if tg_op = 'INSERT' then
    v_acao := case when tg_table_name = 'atribuicoes' then 'atribuiu' else 'criou' end;
  elsif tg_op = 'DELETE' then
    v_acao := case when tg_table_name = 'atribuicoes' then 'desatribuiu' else 'excluiu' end;
  else
    anterior := to_jsonb(old);
    for chave in select jsonb_object_keys(linha) loop
      if not (chave = any (ignorar)) and (linha -> chave) is distinct from (anterior -> chave) then
        diff_antes := diff_antes || jsonb_build_object(chave, anterior -> chave);
        diff_depois := diff_depois || jsonb_build_object(chave, linha -> chave);
      end if;
    end loop;

    -- Nada relevante mudou (ex.: só reordenação)
    if diff_depois = '{}' then
      return null;
    end if;

    if diff_depois ? 'archived_at' then
      v_acao := case when (linha ->> 'archived_at') is null then 'restaurou' else 'arquivou' end;
    elsif tg_table_name = 'tarefas' and diff_depois ? 'concluida' then
      v_acao := case when (linha ->> 'concluida')::boolean then 'concluiu' else 'reabriu' end;
    elsif tg_table_name = 'decisoes' and diff_depois ? 'status' then
      v_acao := case when linha ->> 'status' = 'decidida' then 'decidiu' else 'reabriu_decisao' end;
    else
      v_acao := 'editou';
    end if;

    if tg_table_name = 'decisoes' and linha ->> 'opcao_escolhida_id' is not null then
      v_contexto := v_contexto || jsonb_build_object('opcao',
        (select o.texto from public.decisao_opcoes o where o.id = (linha ->> 'opcao_escolhida_id')::uuid));
    end if;
  end if;

  insert into public.atividades
    (ator_id, acao, entidade, entidade_id, item_id, frente_id, valor_anterior, valor_novo, contexto)
  values (
    auth.uid(), v_acao, v_entidade, (linha ->> 'id')::uuid, v_item_id, v_frente_id,
    case when tg_op = 'UPDATE' then diff_antes end,
    case when tg_op = 'UPDATE' then diff_depois end,
    v_contexto
  );

  return null;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array['frentes', 'itens', 'atribuicoes', 'tarefas', 'decisoes', 'decisao_opcoes', 'notas'] loop
    execute format(
      'create trigger %1$s_atividade after insert or update or delete on public.%1$I
         for each row execute function public.registrar_atividade()', t);
  end loop;
end;
$$;

-- ============================================================
-- Realtime
-- ============================================================
alter publication supabase_realtime add table
  public.frentes, public.itens, public.atribuicoes, public.tarefas,
  public.decisoes, public.decisao_opcoes, public.notas, public.atividades, public.perfis;
