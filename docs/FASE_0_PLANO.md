# Fase 0 — Plano técnico

Proposta de esquema de banco, permissões, estrutura de pastas e dúvidas. **Nada disto foi implementado ainda** — aguarda aprovação.

---

## 1. Esquema do banco (Postgres / Supabase)

### 1.1 Enums

| Enum               | Valores                                                                                                                               |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| `papel_usuario`    | `admin`, `lider`                                                                                                                      |
| `regiao_pessoa`    | `SP`, `Nordeste`, `SP_Nordeste`                                                                                                       |
| `regiao_item`      | `SP`, `Nordeste`, `Nacional`                                                                                                          |
| `layout_frente`    | `linha_do_tempo`, `cadencia`, `lista`                                                                                                 |
| `status_item`      | `ideia`, `em_definicao`, `confirmado`, `realizado`, `cancelado`                                                                       |
| `precisao_data`    | `exata`, `intervalo`, `mes`, `periodo`, `a_definir`                                                                                   |
| `periodo_ano`      | `s1`, `s2`, `t1`, `t2`, `t3`, `t4`, `meio_ano` _(ver dúvida 2)_                                                                       |
| `recorrencia`      | `nenhuma`, `semanal`, `quinzenal`, `mensal`                                                                                           |
| `papel_atribuicao` | `responsavel`, `apoio`                                                                                                                |
| `status_decisao`   | `aberta`, `decidida`                                                                                                                  |
| `acao_atividade`   | `criou`, `editou`, `atribuiu`, `desatribuiu`, `concluiu`, `reabriu`, `decidiu`, `reabriu_decisao`, `arquivou`, `restaurou`, `excluiu` |

### 1.2 Tabelas

```
auth.users (Supabase) 1──1 perfis
frentes 1──N itens
itens 1──N atribuicoes N──1 perfis
itens 1──N tarefas (tarefas.parent_id → tarefas, 1 nível)
itens 1──N decisoes 1──N decisao_opcoes
itens 1──N notas
atividades (log, sem FK rígida para sobreviver a exclusões)
configuracoes (chave/valor)
```

**perfis**

| coluna                 | tipo                                   | obs                                       |
| ---------------------- | -------------------------------------- | ----------------------------------------- |
| id                     | uuid PK                                | = `auth.users.id` (FK, on delete cascade) |
| nome                   | text not null                          |                                           |
| email                  | text not null unique                   | cópia para exibição/busca                 |
| iniciais               | text not null                          | gerado do nome, editável                  |
| regiao                 | regiao_pessoa not null                 |                                           |
| papel                  | papel_usuario not null default `lider` |                                           |
| ativo                  | boolean not null default true          |                                           |
| precisa_trocar_senha   | boolean not null default true          |                                           |
| created_at, updated_at | timestamptz                            |                                           |

**frentes**

| coluna                                          | tipo                   | obs                                                                                 |
| ----------------------------------------------- | ---------------------- | ----------------------------------------------------------------------------------- |
| id                                              | uuid PK                |                                                                                     |
| nome                                            | text not null          |                                                                                     |
| descricao                                       | text                   |                                                                                     |
| cor                                             | text not null          | token de cor (ex.: `violet`), não hex livre, para garantir contraste nos dois temas |
| icone                                           | text not null          | nome de ícone lucide (lista fechada no app)                                         |
| ordem                                           | int not null           |                                                                                     |
| layout                                          | layout_frente not null |                                                                                     |
| created_at, updated_at, created_by, archived_at |                        |                                                                                     |

**itens**

| coluna                                          | tipo                                       | obs                                                          |
| ----------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------ |
| id                                              | uuid PK                                    |                                                              |
| frente_id                                       | uuid FK frentes                            | on delete restrict (exclusão de frente trata os itens antes) |
| titulo                                          | text not null                              |                                                              |
| descricao                                       | text                                       |                                                              |
| regiao                                          | regiao_item not null                       |                                                              |
| local                                           | text                                       |                                                              |
| status                                          | status_item not null default `ideia`       |                                                              |
| data_precisao                                   | precisao_data not null default `a_definir` |                                                              |
| data_inicio                                     | date                                       | **sempre normalizada** (ver abaixo)                          |
| data_fim                                        | date                                       | **sempre normalizada**                                       |
| data_hora                                       | time                                       | só para `exata`                                              |
| data_periodo                                    | periodo_ano                                | só para `periodo`                                            |
| data_texto                                      | text                                       | texto livre de apoio ("final de março / início de abril")    |
| recorrencia                                     | recorrencia not null default `nenhuma`     |                                                              |
| recorrencia_dia_semana                          | smallint 0–6                               | 0 = domingo                                                  |
| recorrencia_estreia                             | date                                       |                                                              |
| recorrencia_texto                               | text                                       | ex.: "conforme eventos"                                      |
| canais                                          | text[] not null default `{}`               | Instagram, YouTube, Spotify…                                 |
| ordem                                           | int not null                               | ordem manual dentro da frente                                |
| created_at, updated_at, created_by, archived_at |                                            |                                                              |

_Normalização de data_ — independentemente da precisão, `data_inicio`/`data_fim` guardam o intervalo coberto. Isso deixa ordenação, "próximos 60 dias" e posicionamento na linha do tempo triviais:

| precisão  | o usuário informa  | gravado                                         |
| --------- | ------------------ | ----------------------------------------------- |
| exata     | 15/11/2026 (+hora) | inicio = fim = 2026-11-15                       |
| intervalo | 10/01 a 12/01/2027 | inicio 2027-01-10, fim 2027-01-12               |
| mes       | jan/2027           | 2027-01-01 → 2027-01-31                         |
| periodo   | 1º sem/2027        | 2027-01-01 → 2027-06-30 (+ `data_periodo = s1`) |
| a_definir | —                  | ambos nulos                                     |

Um `CHECK` garante coerência entre precisão e colunas preenchidas.

**atribuicoes**

| coluna        | tipo                            | obs |
| ------------- | ------------------------------- | --- |
| id            | uuid PK                         |     |
| item_id       | uuid FK itens on delete cascade |     |
| pessoa_id     | uuid FK perfis                  |     |
| papel         | papel_atribuicao not null       |     |
| atribuido_por | uuid FK perfis                  |     |
| created_at    | timestamptz                     |     |

`unique (item_id, pessoa_id)` + índice único parcial `(item_id) where papel = 'responsavel'` → no máximo 1 responsável.
Desatribuir = `DELETE` da linha, permitido a líderes (não é remover item). Sem `archived_at` aqui.

**tarefas**

| coluna                                          | tipo                              | obs                                                      |
| ----------------------------------------------- | --------------------------------- | -------------------------------------------------------- |
| id                                              | uuid PK                           |                                                          |
| item_id                                         | uuid FK itens on delete cascade   |                                                          |
| parent_id                                       | uuid FK tarefas on delete cascade | trigger impede neto (só 1 nível)                         |
| titulo                                          | text not null                     |                                                          |
| concluida                                       | boolean not null default false    |                                                          |
| concluida_em, concluida_por                     |                                   |                                                          |
| responsavel_id                                  | uuid FK perfis                    | opcional                                                 |
| prazo                                           | date                              | opcional; "atrasada" = prazo < hoje (SP) e não concluída |
| ordem                                           | int                               |                                                          |
| created_at, updated_at, created_by, archived_at |                                   |                                                          |

**decisoes**

| coluna                                          | tipo                            | obs                                               |
| ----------------------------------------------- | ------------------------------- | ------------------------------------------------- |
| id                                              | uuid PK                         |                                                   |
| item_id                                         | uuid FK itens on delete cascade |                                                   |
| pergunta                                        | text not null                   |                                                   |
| status                                          | status_decisao default `aberta` |                                                   |
| opcao_escolhida_id                              | uuid FK decisao_opcoes          |                                                   |
| decidida_por, decidida_em                       |                                 |                                                   |
| prazo                                           | date                            | opcional                                          |
| campo_relacionado                               | text check in (`local`, `data`) | opcional; habilita "atualizar o item?" ao decidir |
| ordem                                           | int                             |                                                   |
| created_at, updated_at, created_by, archived_at |                                 |                                                   |

**decisao_opcoes**: `id`, `decisao_id` (cascade), `texto`, `ordem`, `created_at`, `created_by`, `archived_at`.

**notas**: `id`, `item_id` (cascade), `autor_id`, `texto`, `created_at`, `updated_at`, `archived_at`.

**atividades** (somente leitura para o app)

| coluna                     | tipo               | obs                                                                                |
| -------------------------- | ------------------ | ---------------------------------------------------------------------------------- |
| id                         | bigint identity PK |                                                                                    |
| ator_id                    | uuid               | `auth.uid()`                                                                       |
| acao                       | acao_atividade     |                                                                                    |
| entidade                   | text               | `frente`, `item`, `tarefa`, `decisao`, `opcao`, `nota`, `atribuicao`, `perfil`     |
| entidade_id                | uuid               |                                                                                    |
| item_id, frente_id         | uuid               | **sem FK**, para o histórico sobreviver à exclusão                                 |
| campo                      | text               | ex.: `data_inicio`                                                                 |
| valor_anterior, valor_novo | jsonb              |                                                                                    |
| contexto                   | jsonb              | snapshot (título do item, nome da pessoa…) para montar a frase mesmo após exclusão |
| created_at                 | timestamptz        |                                                                                    |

Gravada por triggers `AFTER INSERT/UPDATE/DELETE` (`security definer`) em todas as tabelas de domínio. A frase em português ("Caio Santos alterou a data de Mov Day Petrolina de 15/11 para 22/11") é montada no app a partir dessas colunas.

**configuracoes**: `chave text PK`, `valor jsonb`. Inicial: `limite_sobrecarga = 5`.

### 1.3 Permissões (RLS + triggers)

Funções auxiliares (`security definer`, `stable`): `eh_ativo()` e `eh_admin()` (lêem `perfis` do `auth.uid()`).

| Tabela                                                   | SELECT | INSERT                                                  | UPDATE                                                                                 | DELETE                 |
| -------------------------------------------------------- | ------ | ------------------------------------------------------- | -------------------------------------------------------------------------------------- | ---------------------- |
| perfis                                                   | ativo  | — (só via servidor com service role, após checar admin) | próprio registro ou admin; trigger impede não-admin de mudar `papel`, `ativo`, `email` | — (admin via servidor) |
| frentes, itens, tarefas, decisoes, decisao_opcoes, notas | ativo  | ativo                                                   | ativo                                                                                  | **admin**              |
| atribuicoes                                              | ativo  | ativo                                                   | ativo                                                                                  | ativo (desatribuir)    |
| atividades                                               | ativo  | — (só trigger)                                          | —                                                                                      | —                      |
| configuracoes                                            | ativo  | —                                                       | admin                                                                                  | —                      |

**Arquivar/restaurar** é um `UPDATE` de `archived_at`; como RLS não enxerga coluna, um trigger `BEFORE UPDATE` em cada tabela arquivável rejeita a mudança de `archived_at` se `not eh_admin()`. Assim um líder chamando a API do Supabase direto também é barrado.

**Usuário desativado**: `ativo = false` derruba todas as políticas + o servidor bane a conta no Auth (`ban_duration`). Atribuições existentes são mantidas (ver dúvida 6).

**Troca obrigatória de senha**: o `proxy.ts` do Next redireciona para `/trocar-senha` enquanto `precisa_trocar_senha = true`; a action troca a senha (`auth.updateUser`) e zera a flag.

### 1.4 Realtime

Publicação `supabase_realtime` em `frentes`, `itens`, `atribuicoes`, `tarefas`, `decisoes`, `decisao_opcoes`, `notas`, `atividades`. Presença por canal `item:<id>`. Detecção de conflito comparando `updated_at` carregado × recebido.

---

## 2. Estrutura de pastas

```
.
├── CLAUDE.md
├── docs/                       VISAO_PRODUTO.md, FASE_0_PLANO.md
├── supabase/
│   ├── config.toml
│   ├── migrations/             0001_enums.sql, 0002_tabelas.sql, 0003_rls.sql, 0004_atividades.sql …
│   └── seed.sql                frentes + itens + decisões (seção 10) — sem pessoas
├── seed/
│   ├── pessoas.example.json    nomes/região/papel com e-mails e senhas placeholder (versionado)
│   └── pessoas.local.json      dados reais (gitignored)
├── scripts/
│   └── seed-usuarios.ts        cria contas no Auth + perfis (service role); usado também p/ o 1º admin
├── src/
│   ├── proxy.ts                sessão Supabase + redirect login / trocar-senha
│   ├── app/
│   │   ├── (auth)/login/  (auth)/trocar-senha/
│   │   ├── (app)/layout.tsx    barra superior, abas, busca, filtro região, painel do item (?item=)
│   │   ├── (app)/page.tsx                 Visão geral
│   │   ├── (app)/frentes/[id]/page.tsx    aba de frente (escolhe layout)
│   │   ├── (app)/lideres/  (app)/lideres/[id]/
│   │   ├── (app)/atividade/
│   │   ├── (app)/conta/
│   │   └── (app)/admin/{usuarios,frentes,arquivados}/
│   ├── components/
│   │   ├── ui/                 shadcn
│   │   ├── layout/             BarraTopo, Abas, FiltroRegiao, MenuAvatar
│   │   ├── frentes/            layouts: LinhaDoTempo, Cadencia, Lista; FormFrente
│   │   ├── item/               PainelItem, MapaMental (desktop), ArvoreItem (celular), FormItem, SeletorData
│   │   ├── lideres/  visao-geral/  atividade/  admin/
│   │   └── comum/              Avatar, BadgeStatus, BadgeRegiao, EstadoVazio, Skeletons
│   ├── server/
│   │   ├── actions/            frentes.ts, itens.ts, atribuicoes.ts, tarefas.ts, decisoes.ts, notas.ts, usuarios.ts, conta.ts
│   │   └── consultas/          leituras usadas por server components
│   ├── lib/
│   │   ├── supabase/           client.ts, server.ts, admin.ts (server-only), database.types.ts
│   │   ├── datas/              normalização, formatação por precisão, próxima ocorrência, fuso SP
│   │   ├── validacao/          schemas Zod
│   │   ├── atividade/          frases em linguagem natural
│   │   └── constantes.ts       cores de status/região, ícones permitidos
│   └── hooks/                  useRealtime, usePresenca, useItemAberto
└── .env.example
```

Bibliotecas extras propostas (todas gratuitas/MIT): `@xyflow/react` (mapa mental com pan/zoom), `@dnd-kit` (arrastar abas, lista, atribuição rápida), `date-fns` + `@date-fns/tz`, `next-themes`, `sonner` (avisos).

---

## 3. Dúvidas que bloqueiam

1. **Ambiente Supabase**: desenvolver com Supabase **local** (Docker, que você já tem instalado) e depois subir as migrations para um projeto na nuvem, ou usar direto um projeto na nuvem? Em qualquer caso vou precisar que você crie o projeto no supabase.com e me passe URL + chaves por `.env.local` (não pelo chat).
2. **"Meio de 2027"**: qual intervalo isso representa? Proposta: período `meio_ano` = **junho a agosto**. Alternativas: jun–jul, ou tratar como 2º trimestre/3º trimestre.
3. **Itens de Digital e Loja não têm região nem status na seção 10.** Proposta: região `Nacional` para todos; status `confirmado` para o 024 Cast (tem dia e estreia) e `ideia` para o resto. Ok?
4. **Opções das decisões do seed**: quando a pergunta já lista alternativas ("Limão ou FS?"), crio as opções; quando é sim/não ("Será um encontro em Petrolina?") crio "Sim"/"Não"; quando não há alternativas ("Local a definir", "Formato: viagem online?") deixo sem opções. Ok?
5. **Itens marcados (confirmar)**: além da decisão aberta, adiciono uma nota "Veio de anotação manuscrita — confirmar". Quer isso ou só a decisão?
6. **Usuário desativado**: mantenho as atribuições dele (com avatar acinzentado e o item continuando com responsável) ou removo automaticamente, fazendo os itens voltarem a "sem responsável"?
7. **Notas**: qualquer líder pode editar a nota de outra pessoa (a matriz diz "criar e editar notas ✅"), ou só o autor edita a própria?
8. **Deploy (Fase 9)**: o repositório vai para o GitHub (para a Vercel puxar automaticamente)? Se sim, qual conta/nome de repositório?

Decisões que tomei sem perguntar (me corrija se discordar): pnpm como gerenciador; nomes de código em português sem acento; cores de frente escolhidas de uma paleta fechada (para contraste nos temas claro/escuro); e-mail da pessoa visível para todos os líderes.

### Respostas (aprovado em 09/10/2026: "use as propostas")

1. Supabase **local** (Docker) para desenvolvimento; projeto na nuvem na Fase 9.
2. `meio_ano` = **junho a agosto**.
3. Digital e Loja: região **Nacional**; 024 Cast **confirmado**, demais **ideia**.
4. Opções do seed conforme proposto ("Sexta ou sábado à noite?" → "Sexta à noite" / "Sábado à noite").
5. Itens "(confirmar)" ganham decisão aberta **e** nota.
6. Usuário desativado **mantém** as atribuições (avatar acinzentado).
7. Qualquer líder edita qualquer nota (segue a matriz).
8. GitHub/Vercel: a definir na Fase 9.

### Ajustes descobertos na Fase 1

- Next.js 16 renomeou `middleware.ts` para **`proxy.ts`** e vem com **Cache Components** ligado: leituras de dados ficam dentro de `<Suspense>` com skeleton (o que já atende "nunca tela branca").
- Chaves do Supabase no formato novo: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` e `SUPABASE_SECRET_KEY`.
- No histórico, uma edição gera **uma** linha com todos os campos alterados (em vez de uma por campo); reordenações puras não geram histórico.

### Ajustes descobertos na Fase 2

- **Claims no token**: um _custom access token hook_ (migration `..._claims_token.sql`) copia `papel`, `ativo` e `precisa_trocar_senha` de `perfis` para o JWT. O `proxy.ts` usa isso para redirecionar sem consultar o banco a cada clique. A fonte da verdade continua sendo `perfis` (RLS e páginas consultam a tabela). Na nuvem, o hook precisa ser ativado no painel (README).
- **Desativar conta** = `perfis.ativo = false` + _ban_ no Supabase Auth (impede login e renovação de sessão).
- **Trocar senha em Minha conta** pede a senha atual (conferida antes da troca).
- O cliente Supabase do servidor chama `connection()`: dados do usuário nunca são pré-renderizados.
