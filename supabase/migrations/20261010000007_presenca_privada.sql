-- Presença no item (canal Realtime `item:<id>`) passa a ser canal privado:
-- só usuários logados e ativos entram, veem e anunciam quem está no item.
-- O cliente assina com `private: true`; no painel do Supabase, desligar
-- "Allow public access" em Realtime › Settings para recusar canais públicos.

create policy "presenca_item_ler" on realtime.messages
  for select to authenticated
  using (
    -- A entrada no canal é checada como leitura de broadcast; ninguém consegue
    -- enviar broadcast (a política de escrita só aceita presença).
    realtime.messages.extension in ('broadcast', 'presence')
    and realtime.topic() like 'item:%'
    and public.eh_ativo()
  );

create policy "presenca_item_anunciar" on realtime.messages
  for insert to authenticated
  with check (
    realtime.messages.extension = 'presence'
    and realtime.topic() like 'item:%'
    and public.eh_ativo()
  );
