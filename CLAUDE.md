# Movimento 024 — Planejamento

Dashboard web colaborativo para o planejamento 2026–2028 do Movimento 024 (SP e Nordeste).
Especificação completa: `docs/VISAO_PRODUTO.md`. Plano técnico e esquema: `docs/FASE_0_PLANO.md`.

## Regras de trabalho

- Trabalhar **uma fase por vez** (seção 11 da visão). Ao fim de cada fase: rodar, verificar o aceite, commitar e entregar resumo (feito / como testar / pendente / riscos). Não avançar sem confirmação do Vitor.
- **Não inventar regra de negócio.** Se não está na visão, perguntar.
- Toda a interface em **português do Brasil**, incluindo mensagens de erro (sem jargão técnico).

## Stack

- Next.js (App Router, TypeScript estrito) — front e back no mesmo projeto. Server actions para mutações, route handlers só quando necessário. **Nada de back separado.**
- Supabase: Postgres, Auth (e-mail/senha), Realtime, RLS. Clientes via `@supabase/ssr`.
- Tailwind CSS + shadcn/ui, ícones `lucide-react`.
- Zod para validar toda entrada no servidor.
- Deploy na Vercel. Tudo nos planos gratuitos.
- Gerenciador de pacotes: **pnpm**.

## Convenções

- Código (variáveis, funções, tabelas, colunas, enums) em **português sem acento**, `snake_case` no banco e `camelCase` no TS. Componentes React em `PascalCase`.
- Fuso: `America/Sao_Paulo`. Datas "de calendário" ficam em colunas `date` (sem fuso); instantes em `timestamptz`. Formatar sempre com os helpers de `src/lib/datas`.
- Toda tabela de domínio: `id uuid`, `created_at`, `updated_at`, `created_by`, `archived_at` (nulo = ativo).
- Toda mutação: server action → valida com Zod → chama Supabase com o cliente **do usuário** (RLS vale). O cliente `service_role` (`src/lib/supabase/admin.ts`) só é usado em ações de admin que exigem a Admin API do Auth, e sempre depois de checar `papel = 'admin'`.
- Server actions retornam `{ ok: true, data } | { ok: false, erro: string }` — nunca lançam para a UI.
- Histórico (tabela `atividades`) é gravado por **triggers no banco**, não pelo app.
- Permissões garantidas no banco (RLS + triggers). Esconder botão na UI é só conveniência.
- Schema muda **apenas** por migration nova em `supabase/migrations/` (nunca editar migration já aplicada). Depois de migrar, regenerar tipos: `pnpm db:types`.
- Mobile first: testar toda tela em largura de celular.

## Segurança

- `SUPABASE_SERVICE_ROLE_KEY` só no servidor; nunca em variável `NEXT_PUBLIC_*`, nunca importada por componente client (`import "server-only"`).
- Nada de senha ou e-mail real versionado. `seed/pessoas.local.json` e `.env*.local` estão no `.gitignore`.

## Comandos (a partir da Fase 1)

- `pnpm dev` — desenvolvimento
- `pnpm lint` / `pnpm format` / `pnpm typecheck`
- `pnpm db:types` — gera `src/lib/supabase/database.types.ts`
- `pnpm seed:usuarios` — cria as contas do Auth a partir de `seed/pessoas.local.json`
