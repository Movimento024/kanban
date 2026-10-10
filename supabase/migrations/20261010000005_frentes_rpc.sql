-- Movimento 024 — operações atômicas de frentes e ordenação.
-- Todas são SECURITY INVOKER: rodam com as permissões de quem chama, então
-- o RLS e os triggers (ex.: só admin exclui/arquiva) continuam valendo.

-- Reordena frentes na ordem do array (1, 2, 3...). Reordenação pura não gera histórico.
create function public.reordenar_frentes(p_ids uuid[])
returns void
language sql
security invoker
set search_path = ''
as $$
  update public.frentes f
     set ordem = o.posicao
    from unnest(p_ids) with ordinality as o(id, posicao)
   where f.id = o.id;
$$;

-- Reordena itens de uma frente.
create function public.reordenar_itens(p_frente_id uuid, p_ids uuid[])
returns void
language sql
security invoker
set search_path = ''
as $$
  update public.itens i
     set ordem = o.posicao
    from unnest(p_ids) with ordinality as o(id, posicao)
   where i.id = o.id and i.frente_id = p_frente_id;
$$;

-- Exclui uma frente. Se p_destino for informado, os itens (inclusive arquivados)
-- são movidos para ela antes; senão, são excluídos junto.
-- A exclusão exige admin (política de DELETE); mover itens qualquer ativo pode,
-- mas a função só faz sentido para admin porque termina com o DELETE.
create function public.excluir_frente(p_frente_id uuid, p_destino uuid default null)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  excluidas integer;
  base integer;
begin
  if not public.eh_admin() then
    raise exception 'Apenas administradores podem excluir frentes.' using errcode = '42501';
  end if;

  if p_destino is not null then
    if p_destino = p_frente_id then
      raise exception 'Escolha uma frente diferente para receber os itens.' using errcode = '23514';
    end if;
    if not exists (select 1 from public.frentes where id = p_destino and archived_at is null) then
      raise exception 'A frente de destino não existe ou está arquivada.' using errcode = '23514';
    end if;

    -- Itens movidos vão para o fim da frente de destino, mantendo a ordem relativa.
    select coalesce(max(ordem), 0) into base from public.itens where frente_id = p_destino;
    update public.itens
       set frente_id = p_destino, ordem = base + ordem
     where frente_id = p_frente_id;
  else
    delete from public.itens where frente_id = p_frente_id;
  end if;

  delete from public.frentes where id = p_frente_id;
  get diagnostics excluidas = row_count;
  if excluidas = 0 then
    raise exception 'Frente não encontrada.' using errcode = '23514';
  end if;
end;
$$;

revoke execute on function public.reordenar_frentes, public.reordenar_itens, public.excluir_frente from anon, public;
grant execute on function public.reordenar_frentes, public.reordenar_itens, public.excluir_frente to authenticated;
