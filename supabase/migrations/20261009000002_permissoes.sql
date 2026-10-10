-- Movimento 024 — permissões (matriz da seção 4.3 da visão do produto).
--
-- Regra geral: usuário ativo vê e edita tudo; só admin arquiva, restaura e exclui.
-- Arquivar/restaurar é um UPDATE de archived_at, que RLS não distingue por coluna,
-- por isso é barrado por trigger (impedir_arquivamento_nao_admin).
--
-- auth.uid() nulo = chamada de serviço (service role / seed) e é permitida.

-- ============================================================
-- Travas por trigger
-- ============================================================
create function public.impedir_arquivamento_nao_admin()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if auth.uid() is null or public.eh_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' and new.archived_at is not null then
    raise exception 'Apenas administradores podem arquivar.' using errcode = '42501';
  end if;

  if tg_op = 'UPDATE' and new.archived_at is distinct from old.archived_at then
    if new.archived_at is null then
      raise exception 'Apenas administradores podem restaurar itens arquivados.' using errcode = '42501';
    end if;
    raise exception 'Apenas administradores podem arquivar.' using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger frentes_trava_arquivamento before insert or update on public.frentes
  for each row execute function public.impedir_arquivamento_nao_admin();
create trigger itens_trava_arquivamento before insert or update on public.itens
  for each row execute function public.impedir_arquivamento_nao_admin();
create trigger tarefas_trava_arquivamento before insert or update on public.tarefas
  for each row execute function public.impedir_arquivamento_nao_admin();
create trigger decisoes_trava_arquivamento before insert or update on public.decisoes
  for each row execute function public.impedir_arquivamento_nao_admin();
create trigger decisao_opcoes_trava_arquivamento before insert or update on public.decisao_opcoes
  for each row execute function public.impedir_arquivamento_nao_admin();
create trigger notas_trava_arquivamento before insert or update on public.notas
  for each row execute function public.impedir_arquivamento_nao_admin();

-- Perfis: o próprio usuário só pode mudar a flag de troca de senha (de true para false).
-- Papel, ativo, e-mail, nome e região são do admin.
create function public.proteger_perfil()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if auth.uid() is null or public.eh_admin() then
    return new;
  end if;

  if new.id is distinct from old.id
     or new.nome is distinct from old.nome
     or new.email is distinct from old.email
     or new.iniciais is distinct from old.iniciais
     or new.regiao is distinct from old.regiao
     or new.papel is distinct from old.papel
     or new.ativo is distinct from old.ativo
     or (new.precisa_trocar_senha and not old.precisa_trocar_senha) then
    raise exception 'Apenas administradores podem alterar esses dados.' using errcode = '42501';
  end if;

  return new;
end;
$$;

create trigger perfis_proteger before update on public.perfis
  for each row execute function public.proteger_perfil();

-- Um admin não pode tirar o próprio papel nem se desativar (evita ficar sem admin).
create function public.impedir_auto_rebaixamento()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if auth.uid() is not null and new.id = auth.uid()
     and (new.papel <> 'admin' or not new.ativo) and old.papel = 'admin' then
    raise exception 'Você não pode remover o seu próprio acesso de administrador.' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger perfis_auto_rebaixamento before update on public.perfis
  for each row execute function public.impedir_auto_rebaixamento();

-- ============================================================
-- RLS
-- ============================================================
alter table public.perfis enable row level security;
alter table public.frentes enable row level security;
alter table public.itens enable row level security;
alter table public.atribuicoes enable row level security;
alter table public.tarefas enable row level security;
alter table public.decisoes enable row level security;
alter table public.decisao_opcoes enable row level security;
alter table public.notas enable row level security;
alter table public.configuracoes enable row level security;

-- Perfis: criação/exclusão só pelo servidor (service role) após checar admin.
create policy perfis_select on public.perfis
  for select to authenticated using ((select public.eh_ativo()));
create policy perfis_update on public.perfis
  for update to authenticated
  using ((select public.eh_admin()) or (id = (select auth.uid()) and (select public.eh_ativo())))
  with check ((select public.eh_admin()) or id = (select auth.uid()));

-- Tabelas de domínio: ativo lê/cria/edita, admin exclui.
do $$
declare
  t text;
begin
  foreach t in array array['frentes', 'itens', 'tarefas', 'decisoes', 'decisao_opcoes', 'notas'] loop
    execute format(
      'create policy %1$s_select on public.%1$I for select to authenticated using ((select public.eh_ativo()))', t);
    execute format(
      'create policy %1$s_insert on public.%1$I for insert to authenticated with check ((select public.eh_ativo()))', t);
    execute format(
      'create policy %1$s_update on public.%1$I for update to authenticated using ((select public.eh_ativo())) with check ((select public.eh_ativo()))', t);
    execute format(
      'create policy %1$s_delete on public.%1$I for delete to authenticated using ((select public.eh_admin()))', t);
  end loop;
end;
$$;

-- Atribuições: desatribuir (DELETE) é permitido ao líder — não é remover o item.
create policy atribuicoes_select on public.atribuicoes
  for select to authenticated using ((select public.eh_ativo()));
create policy atribuicoes_insert on public.atribuicoes
  for insert to authenticated with check ((select public.eh_ativo()));
create policy atribuicoes_update on public.atribuicoes
  for update to authenticated using ((select public.eh_ativo())) with check ((select public.eh_ativo()));
create policy atribuicoes_delete on public.atribuicoes
  for delete to authenticated using ((select public.eh_ativo()));

-- Configurações: todos leem, admin altera.
create policy configuracoes_select on public.configuracoes
  for select to authenticated using ((select public.eh_ativo()));
create policy configuracoes_update on public.configuracoes
  for update to authenticated using ((select public.eh_admin())) with check ((select public.eh_admin()));

-- anon não acessa nada (sem políticas para anon); removemos também os grants por clareza.
revoke all on all tables in schema public from anon;
