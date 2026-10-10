-- Movimento 024 — restringe quem pode chamar funções SECURITY DEFINER pela API
-- (alertas do Security Advisor do Supabase).
--
-- eh_ativo/eh_admin: usadas pelas políticas de RLS, que rodam como o usuário
-- logado → continuam executáveis por `authenticated`, mas não por `anon`.
-- registrar_atividade: função de trigger; o trigger dispara independente de
-- EXECUTE, então ninguém precisa chamá-la pela API.

revoke execute on function public.eh_ativo() from anon, public;
revoke execute on function public.eh_admin() from anon, public;
grant execute on function public.eh_ativo() to authenticated;
grant execute on function public.eh_admin() to authenticated;

revoke execute on function public.registrar_atividade() from anon, authenticated, public;
