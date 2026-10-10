## 1. Contexto

O Movimento 024 é um movimento com equipes de líderes em duas regiões: **São Paulo** e **Nordeste**. Hoje o planejamento de 2026 a 2028 vive em uma folha de papel e em um artefato que não representa bem a realidade.

O planejamento tem três eixos que precisam aparecer no sistema:

1. **Tempo** — de outubro/2026 até 2028. Algumas datas são exatas (17/10, 15/11), outras são períodos ("1º semestre de 2027", "meio do ano", "final de janeiro") e outras ainda estão "a definir".
2. **Região** — SP, Nordeste ou Nacional (as duas juntas).
3. **Frente** — a área de atuação: Eventos, Digital, Loja, Ações, e outras que forem surgindo.

Uma parte grande do planejamento é **decisão em aberto**, não tarefa: "Encontro em Petrolina?", "Limão ou FS?", "Itajaí ou SJ do Rio Preto?". O sistema precisa tratar decisões como algo de primeira classe.

## 2. Objetivo

Construir um **dashboard web colaborativo** onde a liderança:

- vê tudo o que está planejado, organizado por frente (abas), no tempo e por região;
- clica em qualquer item e ele **se expande em ramos** (estilo MindMeister): líderes, tarefas, decisões e notas;
- sabe **quem cuida de quê**, tanto pelo item quanto pela visão individual de cada líder;
- acompanha mudanças em tempo real e consegue ver o histórico de quem alterou o quê.

## 3. Stack obrigatória

- **Next.js** (App Router, TypeScript) — front e back no mesmo projeto, usando server actions e route handlers. Não criar back separado.
- **Supabase** — Postgres, Auth (e-mail e senha), Realtime e Row Level Security.
- **Vercel** — deploy do app.
- Tudo dentro dos planos gratuitos.
- UI: Tailwind CSS + shadcn/ui. Ícones: lucide.
- Validação de formulários e dados no servidor com Zod.
- Datas e fuso: `America/Sao_Paulo`. Interface 100% em português do Brasil.
- Responsivo: tem que funcionar bem no celular, porque a maioria dos líderes vai abrir pelo telefone.

## 4. Usuários, papéis e permissões

### 4.1 Login

- Login apenas com **e-mail e senha** via Supabase Auth.
- **Não existe cadastro aberto.** Só um admin cria contas, informando nome, e-mail, região, papel e uma senha inicial.
- No primeiro acesso, o usuário é obrigado a trocar a senha.
- Cada usuário pode trocar a própria senha depois, em "Minha conta".
- A criação de contas pelo admin deve acontecer no servidor (nunca expor chaves privilegiadas no navegador).

### 4.2 Papéis

| Papel | Descrição |
|---|---|
| **Admin** | Pode tudo. |
| **Líder** | Pode tudo, **exceto remover e arquivar**. |

### 4.3 Matriz de permissões

| Ação | Líder | Admin |
|---|---|---|
| Ver todas as abas, itens e pessoas | ✅ | ✅ |
| Criar e editar frentes (nome, cor, tipo, ordem) | ✅ | ✅ |
| Criar e editar itens/eventos | ✅ | ✅ |
| Criar e editar tarefas, decisões, opções e notas | ✅ | ✅ |
| Se atribuir e se remover de um item | ✅ | ✅ |
| Atribuir e desatribuir outras pessoas | ✅ | ✅ |
| Marcar tarefa como concluída / escolher opção de decisão | ✅ | ✅ |
| **Arquivar** frente, item, tarefa, decisão ou nota | ❌ | ✅ |
| **Excluir definitivamente** qualquer coisa | ❌ | ✅ |
| Restaurar algo arquivado | ❌ | ✅ |
| Criar contas, mudar papel, desativar usuário | ❌ | ✅ |

Observações:
- Desatribuir uma pessoa de um item **não** é remover o item; o líder pode fazer.
- As permissões precisam ser garantidas **no banco (RLS)** e no servidor, não apenas escondendo botões na interface.
- Para o líder, os botões de arquivar e excluir simplesmente não aparecem.
- Excluir é sempre precedido de confirmação. Arquivar é o padrão recomendado; excluir definitivamente fica em um menu secundário.

### 4.4 Primeiro admin

O primeiro usuário admin é **Vitor Santos**. Prever uma forma segura de criar esse primeiro admin (por exemplo, script de seed ou instrução manual no Supabase), documentada no README.

## 5. Modelo de domínio (conceitual)

Descreva e crie as tabelas, relações, enums e políticas RLS a partir destes conceitos. Use UUID como identificador, `created_at`, `updated_at`, `created_by` e `archived_at` (nulo quando ativo) onde fizer sentido.

### 5.1 Pessoa (perfil)
- Nome completo, e-mail, iniciais (para avatar), região (`SP`, `Nordeste`, `SP e Nordeste`), papel (`admin`, `lider`), ativo/inativo, flag "precisa trocar senha".
- Ligada 1:1 ao usuário do Supabase Auth.

### 5.2 Frente
- É o que vira **aba** no dashboard.
- Campos: nome, descrição curta, cor, ícone, ordem de exibição, **tipo de layout**, arquivada ou não.
- Tipos de layout:
  - **Linha do tempo** — para itens datados (ex.: Eventos, Ações).
  - **Cadência** — para frentes recorrentes (ex.: Digital).
  - **Lista** — para frentes simples ou operacionais (ex.: Loja).
- O tipo pode ser trocado depois; os itens continuam os mesmos, só a forma de exibir muda.

### 5.3 Item
É a unidade principal do sistema. **Qualquer ação é um item** — um Mov Day, uma viagem, um podcast, uma ação social na casa de alguém.

Campos:
- Título e descrição.
- Frente a que pertence.
- **Região**: `SP`, `Nordeste` ou `Nacional`.
- **Local** (texto livre, opcional; ex.: "Petrolina", "Cajazeiras").
- **Status de maturidade**:
  - `ideia` — só uma intenção;
  - `em_definicao` — tem perguntas em aberto;
  - `confirmado` — data e local fechados;
  - `realizado` — já aconteceu;
  - `cancelado`.
- **Data com precisão variável**:
  - `exata` — um dia (ex.: 15/11/2026), com hora opcional;
  - `intervalo` — data de início e fim (ex.: acampamento de 3 dias);
  - `mes` — só mês e ano (ex.: janeiro/2027);
  - `periodo` — semestre ou trimestre de um ano (ex.: 1º semestre/2027, meio de 2027);
  - `a_definir` — sem data.
  - Guardar também um texto livre de apoio, para expressões como "final de março / início de abril".
- **Recorrência** (usada principalmente pela frente Cadência): nenhuma, semanal, quinzenal, mensal; dia da semana; data de estreia; canal(is) (Instagram, YouTube, Spotify…).
- Ordem manual dentro da frente.

### 5.4 Atribuição (pessoa ↔ item)
- Papel na atribuição: **responsável** (no máximo 1 por item) ou **apoio** (vários).
- Quem atribuiu e quando.
- Se o item não tiver responsável, ele aparece como pendência.

### 5.5 Tarefa (ramo do item)
- Título, concluída sim/não, responsável opcional, prazo opcional, ordem.
- Tarefas podem ter **subtarefas** (um nível de aninhamento é suficiente).

### 5.6 Decisão (ramo do item)
- Pergunta (ex.: "Onde será o Mov Day SP?").
- Lista de **opções** (ex.: "Limão", "FS").
- Status: `aberta` ou `decidida`; quando decidida, guarda a opção escolhida, quem decidiu e quando.
- Opcional: prazo para decidir.
- Ao decidir uma questão de local ou data, oferecer atualizar o campo correspondente do item.

### 5.7 Nota (ramo do item)
- Texto livre com autor e data, em formato de comentários cronológicos.

### 5.8 Atividade (histórico)
- Registro de toda criação, edição, atribuição, conclusão, decisão, arquivamento, restauração e exclusão.
- Guarda: quem, o quê, em qual item/frente, valor anterior e novo (quando aplicável), quando.
- Exibido em linguagem natural: "Caio Santos alterou a data de Mov Day Petrolina de 15/11 para 22/11".

## 6. Estrutura de navegação e telas

Barra superior fixa com: nome "Movimento 024", **abas**, busca, filtro de região global, avatar com menu (Minha conta, Sair, e Admin para admins).

Ordem das abas:

1. **Visão geral** (fixa)
2. **Uma aba por frente** (dinâmicas, na ordem definida; botão "+ Nova frente" ao final)
3. **Por líder** (fixa)
4. **Atividade** (fixa)
5. **Admin** (fixa, visível só para admins)

No celular, as abas viram um seletor deslizável horizontal.

### 6.1 Aba Visão geral

Painel de entrada que responde "como estamos?":

- **Contadores**: total de itens ativos; itens por status; decisões abertas; itens sem responsável; tarefas atrasadas.
- **Próximos 60 dias**: lista dos itens com data nesse intervalo, de todas as frentes.
- **Pendências**: itens sem responsável e decisões abertas, com atalho para abrir cada um.
- **Linha do tempo consolidada**: todas as frentes de tipo Linha do tempo juntas, em formato compacto, de out/2026 a 2028.
- Filtro de região (Todos, SP, Nordeste, Nacional) afeta tudo na tela.

### 6.2 Abas de frente — layout Linha do tempo

Exemplo: **Eventos**, **Ações**.

- Eixo horizontal de tempo agrupado por **ano → semestre → mês**, rolável, começando no mês atual.
- **Raias horizontais por região**: SP, Nordeste e Nacional.
- Cada item é um card posicionado na raia e no ponto do tempo correspondente:
  - data `exata`: ocupa o dia;
  - `intervalo`: ocupa do início ao fim;
  - `mes`: ocupa o mês inteiro, com borda tracejada;
  - `periodo`: ocupa o semestre/trimestre, com borda tracejada e transparência maior;
  - `a_definir`: aparece numa coluna fixa "Sem data" no início da linha do tempo.
- O card mostra: título, data (formatada conforme a precisão), local, avatares do responsável e apoio, badge de status e um indicador numérico de decisões abertas (ex.: "2 ?").
- Alternância de visualização dentro da aba: **Linha do tempo** | **Lista** (lista agrupada por mês, ótima para celular — no celular a lista deve ser o padrão).
- Botão "+ Novo item" que abre o formulário já com a frente preenchida; clicar em um espaço vazio da raia pré-preenche região e mês.

### 6.3 Abas de frente — layout Cadência

Exemplo: **Digital**.

- Grade de cards, um por item recorrente (024 Cast, Devocionais, Livros…).
- O card mostra: título, canais, cadência ("toda terça"), data de estreia, próxima ocorrência calculada, responsável e apoio, status.
- Visualização alternativa: **Semana** — uma faixa de segunda a domingo mostrando o que sai em cada dia.
- Itens sem recorrência (ex.: "Execução: edição e postagem") aparecem normalmente como card, sem a próxima ocorrência.

### 6.4 Abas de frente — layout Lista

Exemplo: **Loja**.

- Lista simples ordenável por arrastar, agrupável por status.
- Cada linha: título, status, responsável, quantidade de tarefas concluídas / total.

### 6.5 Expansão do item (estilo mapa mental)

Ao clicar em qualquer card, em qualquer aba:

- **Desktop**: abre um painel lateral grande (ou tela cheia opcional) com o **mapa mental do item**:
  - nó central: o item (título, data, região, status);
  - quatro ramos: **Líderes**, **Tarefas**, **Decisões**, **Notas**, cada um mostrando a contagem;
  - clicar em um ramo o expande mostrando seus filhos como nós; tarefas com subtarefas expandem mais um nível; decisões expandem mostrando as opções;
  - cada nó pode ser editado ali mesmo (clique para editar, Enter para salvar);
  - "+" em cada ramo para adicionar um filho;
  - botão "Expandir tudo" / "Recolher tudo";
  - pan e zoom no mapa.
- **Celular**: o mesmo conteúdo como **árvore vertical recolhível** (acordeão), não como mapa com zoom.
- Em ambos, acima do mapa: edição dos campos do item (título, descrição, frente, região, local, status, data com seletor de precisão, recorrência quando aplicável).
- Rodapé do painel: histórico de atividade daquele item.
- Ações: "Me atribuir" em destaque se o usuário não estiver no item; para admins, "Arquivar" e, em menu secundário, "Excluir".
- A URL deve refletir o item aberto (ex.: `?item=<id>`) para que um link possa ser compartilhado no WhatsApp e abra direto no item.

### 6.6 Aba Por líder

- Filtro por região (Todos, SP, Nordeste) e busca por nome.
- Grade de cards de pessoas: avatar com iniciais, nome, região, quantidade de itens como **responsável** e como **apoio**, tarefas abertas.
- Destaque visual para quem está sem nenhuma responsabilidade e para quem está sobrecarregado (limite configurável, padrão 5 itens como responsável).
- Clicar em uma pessoa abre a **visão individual**:
  - itens em que é responsável, depois os de apoio, agrupados por frente e ordenados por data;
  - tarefas atribuídas a ela, abertas primeiro;
  - decisões abertas dos itens em que é responsável.
- Atalho **"Minhas responsabilidades"** no menu do avatar, que abre essa mesma visão para o usuário logado.
- Atribuição rápida: arrastar uma pessoa da lista para um card de item (desktop) ou selecionar pessoas e escolher o item (celular), mantendo a ideia do artefato atual.

### 6.7 Aba Atividade

- Feed cronológico de todas as mudanças, com filtros por pessoa, frente, tipo de ação e período.
- Cada entrada leva ao item correspondente.

### 6.8 Aba Admin (só admins)

- **Usuários**: criar conta (nome, e-mail, região, papel, senha inicial), editar, trocar papel, desativar/reativar, redefinir senha.
- **Frentes**: reordenar, arquivar, restaurar, excluir.
- **Arquivados**: lista de tudo que está arquivado, com restaurar e excluir definitivamente.

### 6.9 Telas de conta

- Login (e-mail e senha), troca obrigatória de senha no primeiro acesso, Minha conta (trocar senha, ver meus dados).

## 7. Criação e edição de frentes

- "+ Nova frente" ao final das abas abre um formulário: nome, descrição, cor, ícone e **tipo de layout** (com uma prévia visual de cada tipo).
- Renomear, mudar cor/ícone/tipo e reordenar (arrastar as abas) ficam disponíveis para líderes e admins.
- Arquivar e excluir frentes: só admin. Ao arquivar uma frente, os itens dela saem das telas mas continuam no banco e voltam ao restaurar. Excluir uma frente com itens exige escolher: mover os itens para outra frente ou excluir junto (com confirmação digitando o nome da frente).

## 8. Colaboração em tempo real

- Usar Supabase Realtime para que criações, edições e atribuições apareçam para todos sem recarregar.
- Indicador discreto de presença: avatares de quem está com o mesmo item aberto.
- Conflito de edição: última gravação vence, mas se o item mudou enquanto outra pessoa editava, mostrar aviso "Este item foi alterado por X agora há pouco" com opção de recarregar.
- Feedback otimista na interface (a mudança aparece na hora e é revertida com aviso se falhar).

## 9. Variações visuais e estados

- **Cores de status**: ideia (cinza), em definição (âmbar), confirmado (verde), realizado (azul), cancelado (vermelho, riscado).
- **Cores de região**: SP e Nordeste com cores próprias e consistentes em todo o app; Nacional com uma terceira cor.
- **Precisão de data** sempre visível: borda sólida para exata/intervalo, tracejada para mês/período, coluna "Sem data" para a definir.
- **Badge de pendência**: "Sem responsável" e "N decisões abertas".
- **Tema**: claro e escuro, seguindo o sistema, com alternância manual.
- **Estados vazios** amigáveis em todas as telas (ex.: "Nenhum evento no Nordeste ainda — criar o primeiro").
- **Carregamento**: skeletons, nunca tela branca.
- **Erros**: mensagens em português, claras, sem jargão técnico.
- Acessibilidade: navegação por teclado, foco visível, contraste adequado, rótulos em todos os botões de ícone.

## 10. Dados iniciais (seed)

Criar um seed com os dados abaixo. Itens marcados com **(confirmar)** vieram de anotação manuscrita; registrar a dúvida como **Decisão aberta** no item em vez de inventar.

### 10.1 Pessoas (todas como líder, exceto Vitor Santos, admin)

- **SP e Nordeste**: Sthefany Almeida, Caio Santos
- **SP**: Andréa de Aquino, Carolina Araújo, Gustavo Noan, Izabela Ribeiro, Jaqueline Damásio, João Victor Façanha, Luiz Climax, Matheus Bastos, Vitor Santos, Wallace Damásio, Yasmim Cruz
- **Nordeste**: Débora Moura, Ester Menezes, Jade Menezes, Marília Gabriela, Matheus Moura, Rebeca Moura

E-mails e senhas iniciais: deixar como placeholders em um arquivo de exemplo, nunca versionar senhas reais.

### 10.2 Frentes

| Frente | Tipo |
|---|---|
| Eventos | Linha do tempo |
| Ações | Linha do tempo |
| Digital | Cadência |
| Loja | Lista |

### 10.3 Itens — Eventos

| Item | Região | Data | Status | Decisões abertas |
|---|---|---|---|---|
| Evento SP 2026 | SP | a definir | ideia | — |
| Mov Day Monte Santo | Nordeste | 17/10/2026 | confirmado | — |
| Mov Day Petrolina | Nordeste | 15/11/2026 | em definição | "Será um encontro em Petrolina?" |
| Mov Day Cajazeiras / Fortaleza | Nordeste | 05/12/2026 | em definição | "Cajazeiras ou Fortaleza?" |
| Louvorzão SP | SP | janeiro/2027 (texto: "final de janeiro") | ideia | — |
| Mov Day SP | SP | 1º sem/2027 (texto: "final de março / início de abril") | em definição | "Local: Limão ou FS?" (confirmar) |
| Mov Day Nordeste | Nordeste | 1º sem/2027 | em definição | "Local: Cajazeiras ou outra cidade?" (confirmar) |
| Acampa Nordeste | Nordeste | 1º sem/2027 | ideia | — |
| Viagem SP | SP | meio de 2027 | em definição | "Destino: Serra do Sul, Campina Grande-PB, Itajaí ou SJ do Rio Preto?" (confirmar) |
| Viagem Nordeste | Nordeste | meio de 2027 | em definição | "Destino: Cajazeiras ou Fortaleza?" |
| Conferência Nacional | Nacional | 2º sem/2027 | em definição | "Local a definir" (confirmar) |
| Acampamento Nacional de Carnaval | Nacional | fevereiro/2028 | ideia | — |

### 10.4 Itens — Ações

| Item | Região | Data | Status | Decisões abertas |
|---|---|---|---|---|
| Ação de evangelização SP | SP | a definir | em definição | "Sexta ou sábado à noite?" ; "Formato: viagem online?" (confirmar) |

### 10.5 Itens — Digital

| Item | Canais | Cadência |
|---|---|---|
| 024 Cast (podcast) | YouTube / Spotify | semanal, terças, estreia 06/10/2026 |
| Devocionais | Instagram | a definir |
| Livros | Instagram | a definir |
| Louvor + Devocional | Instagram + YouTube | a definir |
| Eventos: divulgação e cobertura | Instagram | conforme eventos |
| Stories (ideias dos líderes) | Instagram | a definir |
| Execução: edição e postagem | centralizada | sem recorrência |

### 10.6 Itens — Loja

| Item | Status |
|---|---|
| Loja (estrutura a definir) | ideia |

Nenhum item começa com pessoas atribuídas.

## 11. Ordem de construção (fases)

Trabalhe **uma fase por vez**. Ao final de cada fase: rode o projeto, verifique os critérios de aceite, faça commit com mensagem descritiva e me mostre um resumo do que foi feito e do que eu devo testar. **Não avance para a próxima fase sem minha confirmação.**

### Fase 0 — Planejamento
- Leia este documento inteiro, salve como `docs/VISAO_PRODUTO.md` e crie um `CLAUDE.md` com as convenções do projeto.
- Proponha o esquema do banco (tabelas, relações, enums, RLS) e a estrutura de pastas **antes de implementar**, e aguarde aprovação.
- Liste dúvidas que bloqueiam a implementação.

### Fase 1 — Base do projeto
- Next.js + TypeScript + Tailwind + shadcn/ui, lint e formatação.
- Conexão com Supabase (variáveis de ambiente documentadas em `.env.example`).
- Migrations do banco e seed da seção 10.
- **Aceite**: o projeto roda localmente e o banco tem as tabelas e os dados iniciais.

### Fase 2 — Autenticação e papéis
- Login, troca obrigatória de senha, Minha conta, logout.
- RLS completo conforme a matriz da seção 4.3.
- Tela Admin › Usuários.
- **Aceite**: um líder não consegue arquivar nem excluir nada, nem pela interface nem chamando o banco diretamente; um admin consegue.

### Fase 3 — Frentes e abas
- Barra de abas dinâmica, criar/editar/reordenar frentes, arquivar/excluir para admin.
- Layout Lista funcionando com itens.
- **Aceite**: criar uma frente nova faz surgir uma aba nova na hora.

### Fase 4 — Itens e Linha do tempo
- CRUD de itens com data de precisão variável, região, status e local.
- Layout Linha do tempo com raias por região e alternância para Lista.
- **Aceite**: todos os eventos do seed aparecem na posição correta, inclusive os de período e "sem data".

### Fase 5 — Expansão estilo mapa mental
- Painel do item com mapa mental (desktop) e árvore recolhível (celular).
- Ramos Líderes, Tarefas (com subtarefas), Decisões (com opções e escolha) e Notas.
- Link compartilhável por item.
- **Aceite**: dá para planejar um evento inteiro sem sair do painel do item.

### Fase 6 — Layout Cadência
- Cards recorrentes com próxima ocorrência e a visualização Semana.
- **Aceite**: a frente Digital mostra o 024 Cast com a próxima terça calculada.

### Fase 7 — Por líder e Visão geral
- Aba Por líder, visão individual, Minhas responsabilidades, atribuição rápida.
- Aba Visão geral com contadores, próximos 60 dias, pendências e linha do tempo consolidada.
- **Aceite**: dá para responder em poucos segundos "o que a Débora tem nas mãos?" e "o que está sem dono?".

### Fase 8 — Tempo real e histórico
- Realtime, presença, aviso de conflito, aba Atividade e histórico por item.
- **Aceite**: com duas sessões abertas, uma atribuição feita em uma aparece na outra sem recarregar.

### Fase 9 — Acabamento e deploy
- Revisão de responsividade, tema escuro, estados vazios, acessibilidade.
- Deploy na Vercel e instruções no README (variáveis, criação do primeiro admin, como rodar o seed).
- **Aceite**: app publicado e acessível pelo celular.

## 12. Fora do escopo por enquanto

- Cadastro aberto, login social, recuperação de senha por e-mail (admin redefine).
- Notificações por e-mail, WhatsApp ou push.
- Financeiro, inscrições de participantes e venda da loja.
- Outros papéis além de admin e líder.
- Aplicativo nativo.

## 13. Regras de trabalho para você (Claude Code)

- Não invente regras de negócio: quando algo não estiver aqui, pergunte.
- Mantenha toda a interface em português do Brasil.
- Segurança primeiro: permissões no banco, chaves privilegiadas só no servidor, nada sensível no repositório.
- Prefira soluções simples que caibam nos planos gratuitos de Vercel e Supabase.
- Ao final de cada fase, entregue: o que foi feito, como testar, o que ficou pendente e riscos que você percebeu.
