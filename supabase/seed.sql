-- Movimento 024 — dados iniciais (seção 10 da visão do produto).
-- Pessoas NÃO estão aqui: contas do Auth são criadas por `pnpm seed:usuarios`.
-- Itens marcados "(confirmar)" vieram de anotação manuscrita: ficam como decisão
-- aberta + nota, sem inventar a resposta.

-- ------------------------------------------------------------
-- Frentes
-- ------------------------------------------------------------
insert into public.frentes (id, nome, descricao, cor, icone, ordem, layout) values
  ('00000000-0000-4000-a000-000000000001', 'Eventos', 'Mov Days, viagens, acampamentos e conferências', 'violet', 'calendar-days', 1, 'linha_do_tempo'),
  ('00000000-0000-4000-a000-000000000002', 'Ações', 'Ações de evangelização e ações sociais', 'orange', 'hand-heart', 2, 'linha_do_tempo'),
  ('00000000-0000-4000-a000-000000000003', 'Digital', 'Conteúdo recorrente nas redes', 'sky', 'radio', 3, 'cadencia'),
  ('00000000-0000-4000-a000-000000000004', 'Loja', 'Estrutura e operação da loja', 'emerald', 'store', 4, 'lista');

-- ------------------------------------------------------------
-- Itens
-- ------------------------------------------------------------
insert into public.itens
  (id, frente_id, titulo, regiao, local, status, data_precisao, data_inicio, data_periodo, data_texto, ordem)
values
  -- Eventos
  ('00000000-0000-4000-b000-000000000001', '00000000-0000-4000-a000-000000000001', 'Evento SP 2026', 'SP', null, 'ideia', 'a_definir', null, null, null, 1),
  ('00000000-0000-4000-b000-000000000002', '00000000-0000-4000-a000-000000000001', 'Mov Day Monte Santo', 'Nordeste', 'Monte Santo', 'confirmado', 'exata', '2026-10-17', null, null, 2),
  ('00000000-0000-4000-b000-000000000003', '00000000-0000-4000-a000-000000000001', 'Mov Day Petrolina', 'Nordeste', 'Petrolina', 'em_definicao', 'exata', '2026-11-15', null, null, 3),
  ('00000000-0000-4000-b000-000000000004', '00000000-0000-4000-a000-000000000001', 'Mov Day Cajazeiras / Fortaleza', 'Nordeste', null, 'em_definicao', 'exata', '2026-12-05', null, null, 4),
  ('00000000-0000-4000-b000-000000000005', '00000000-0000-4000-a000-000000000001', 'Louvorzão SP', 'SP', null, 'ideia', 'mes', '2027-01-01', null, 'final de janeiro', 5),
  ('00000000-0000-4000-b000-000000000006', '00000000-0000-4000-a000-000000000001', 'Mov Day SP', 'SP', null, 'em_definicao', 'periodo', '2027-01-01', 's1', 'final de março / início de abril', 6),
  ('00000000-0000-4000-b000-000000000007', '00000000-0000-4000-a000-000000000001', 'Mov Day Nordeste', 'Nordeste', null, 'em_definicao', 'periodo', '2027-01-01', 's1', null, 7),
  ('00000000-0000-4000-b000-000000000008', '00000000-0000-4000-a000-000000000001', 'Acampa Nordeste', 'Nordeste', null, 'ideia', 'periodo', '2027-01-01', 's1', null, 8),
  ('00000000-0000-4000-b000-000000000009', '00000000-0000-4000-a000-000000000001', 'Viagem SP', 'SP', null, 'em_definicao', 'periodo', '2027-01-01', 'meio_ano', null, 9),
  ('00000000-0000-4000-b000-000000000010', '00000000-0000-4000-a000-000000000001', 'Viagem Nordeste', 'Nordeste', null, 'em_definicao', 'periodo', '2027-01-01', 'meio_ano', null, 10),
  ('00000000-0000-4000-b000-000000000011', '00000000-0000-4000-a000-000000000001', 'Conferência Nacional', 'Nacional', null, 'em_definicao', 'periodo', '2027-01-01', 's2', null, 11),
  ('00000000-0000-4000-b000-000000000012', '00000000-0000-4000-a000-000000000001', 'Acampamento Nacional de Carnaval', 'Nacional', null, 'ideia', 'mes', '2028-02-01', null, null, 12),
  -- Ações
  ('00000000-0000-4000-b000-000000000021', '00000000-0000-4000-a000-000000000002', 'Ação de evangelização SP', 'SP', null, 'em_definicao', 'a_definir', null, null, null, 1),
  -- Loja
  ('00000000-0000-4000-b000-000000000041', '00000000-0000-4000-a000-000000000004', 'Loja (estrutura a definir)', 'Nacional', null, 'ideia', 'a_definir', null, null, null, 1);

-- Digital (cadência)
insert into public.itens
  (id, frente_id, titulo, descricao, regiao, status, canais, recorrencia, recorrencia_dia_semana, recorrencia_estreia, recorrencia_texto, ordem)
values
  ('00000000-0000-4000-b000-000000000031', '00000000-0000-4000-a000-000000000003', '024 Cast (podcast)', null, 'Nacional', 'confirmado', '{YouTube,Spotify}', 'semanal', 2, '2026-10-06', null, 1),
  ('00000000-0000-4000-b000-000000000032', '00000000-0000-4000-a000-000000000003', 'Devocionais', null, 'Nacional', 'ideia', '{Instagram}', 'nenhuma', null, null, 'a definir', 2),
  ('00000000-0000-4000-b000-000000000033', '00000000-0000-4000-a000-000000000003', 'Livros', null, 'Nacional', 'ideia', '{Instagram}', 'nenhuma', null, null, 'a definir', 3),
  ('00000000-0000-4000-b000-000000000034', '00000000-0000-4000-a000-000000000003', 'Louvor + Devocional', null, 'Nacional', 'ideia', '{Instagram,YouTube}', 'nenhuma', null, null, 'a definir', 4),
  ('00000000-0000-4000-b000-000000000035', '00000000-0000-4000-a000-000000000003', 'Eventos: divulgação e cobertura', null, 'Nacional', 'ideia', '{Instagram}', 'nenhuma', null, null, 'conforme eventos', 5),
  ('00000000-0000-4000-b000-000000000036', '00000000-0000-4000-a000-000000000003', 'Stories (ideias dos líderes)', null, 'Nacional', 'ideia', '{Instagram}', 'nenhuma', null, null, 'a definir', 6),
  ('00000000-0000-4000-b000-000000000037', '00000000-0000-4000-a000-000000000003', 'Execução: edição e postagem', 'Centralizada.', 'Nacional', 'ideia', '{}', 'nenhuma', null, null, null, 7);

-- ------------------------------------------------------------
-- Decisões abertas e opções
-- ------------------------------------------------------------
insert into public.decisoes (id, item_id, pergunta, campo_relacionado, ordem) values
  ('00000000-0000-4000-c000-000000000001', '00000000-0000-4000-b000-000000000003', 'Será um encontro em Petrolina?', null, 1),
  ('00000000-0000-4000-c000-000000000002', '00000000-0000-4000-b000-000000000004', 'Cajazeiras ou Fortaleza?', 'local', 1),
  ('00000000-0000-4000-c000-000000000003', '00000000-0000-4000-b000-000000000006', 'Local: Limão ou FS?', 'local', 1),
  ('00000000-0000-4000-c000-000000000004', '00000000-0000-4000-b000-000000000007', 'Local: Cajazeiras ou outra cidade?', 'local', 1),
  ('00000000-0000-4000-c000-000000000005', '00000000-0000-4000-b000-000000000009', 'Destino: Serra do Sul, Campina Grande-PB, Itajaí ou SJ do Rio Preto?', 'local', 1),
  ('00000000-0000-4000-c000-000000000006', '00000000-0000-4000-b000-000000000010', 'Destino: Cajazeiras ou Fortaleza?', 'local', 1),
  ('00000000-0000-4000-c000-000000000007', '00000000-0000-4000-b000-000000000011', 'Local a definir', 'local', 1),
  ('00000000-0000-4000-c000-000000000008', '00000000-0000-4000-b000-000000000021', 'Sexta ou sábado à noite?', null, 1),
  ('00000000-0000-4000-c000-000000000009', '00000000-0000-4000-b000-000000000021', 'Formato: viagem online?', null, 2);

insert into public.decisao_opcoes (decisao_id, texto, ordem) values
  ('00000000-0000-4000-c000-000000000001', 'Sim', 1),
  ('00000000-0000-4000-c000-000000000001', 'Não', 2),
  ('00000000-0000-4000-c000-000000000002', 'Cajazeiras', 1),
  ('00000000-0000-4000-c000-000000000002', 'Fortaleza', 2),
  ('00000000-0000-4000-c000-000000000003', 'Limão', 1),
  ('00000000-0000-4000-c000-000000000003', 'FS', 2),
  ('00000000-0000-4000-c000-000000000004', 'Cajazeiras', 1),
  ('00000000-0000-4000-c000-000000000004', 'Outra cidade', 2),
  ('00000000-0000-4000-c000-000000000005', 'Serra do Sul', 1),
  ('00000000-0000-4000-c000-000000000005', 'Campina Grande-PB', 2),
  ('00000000-0000-4000-c000-000000000005', 'Itajaí', 3),
  ('00000000-0000-4000-c000-000000000005', 'SJ do Rio Preto', 4),
  ('00000000-0000-4000-c000-000000000006', 'Cajazeiras', 1),
  ('00000000-0000-4000-c000-000000000006', 'Fortaleza', 2),
  ('00000000-0000-4000-c000-000000000008', 'Sexta à noite', 1),
  ('00000000-0000-4000-c000-000000000008', 'Sábado à noite', 2);

-- ------------------------------------------------------------
-- Notas de "(confirmar)"
-- ------------------------------------------------------------
insert into public.notas (item_id, texto) values
  ('00000000-0000-4000-b000-000000000006', 'Veio de anotação manuscrita — confirmar a decisão de local.'),
  ('00000000-0000-4000-b000-000000000007', 'Veio de anotação manuscrita — confirmar a decisão de local.'),
  ('00000000-0000-4000-b000-000000000009', 'Veio de anotação manuscrita — confirmar as opções de destino.'),
  ('00000000-0000-4000-b000-000000000011', 'Veio de anotação manuscrita — confirmar o local.'),
  ('00000000-0000-4000-b000-000000000021', 'Veio de anotação manuscrita — confirmar o formato ("viagem online?").');

-- O seed não é atividade de ninguém: limpa o histórico gerado pelos triggers.
delete from public.atividades;
