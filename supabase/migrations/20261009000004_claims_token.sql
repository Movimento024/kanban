-- Movimento 024 — claims no token de acesso (custom access token hook).
--
-- Copia papel, ativo e precisa_trocar_senha de perfis para o JWT, para o
-- proxy do Next decidir redirecionamentos sem consultar o banco a cada
-- requisição. A fonte da verdade continua sendo a tabela perfis: o RLS
-- consulta perfis diretamente e o token só serve para navegação.
--
-- Supabase nuvem: ativar em Authentication → Hooks → Customize Access Token,
-- escolhendo a função public.custom_access_token_hook.

create function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  claims jsonb := event -> 'claims';
  perfil record;
begin
  select p.papel, p.ativo, p.precisa_trocar_senha
    into perfil
    from public.perfis p
   where p.id = (event ->> 'user_id')::uuid;

  if found then
    claims := claims
      || jsonb_build_object(
           'papel', perfil.papel,
           'ativo', perfil.ativo,
           'precisa_trocar_senha', perfil.precisa_trocar_senha);
  else
    claims := claims || jsonb_build_object('papel', null, 'ativo', false, 'precisa_trocar_senha', false);
  end if;

  return jsonb_set(event, '{claims}', claims);
end;
$$;

grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook from authenticated, anon, public;

grant select on table public.perfis to supabase_auth_admin;
create policy perfis_auth_hook on public.perfis
  as permissive for select to supabase_auth_admin using (true);
