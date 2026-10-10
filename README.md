# Movimento 024 — Planejamento

Dashboard colaborativo do planejamento 2026–2028 do Movimento 024 (SP e Nordeste).

- Visão do produto: [`docs/VISAO_PRODUTO.md`](docs/VISAO_PRODUTO.md)
- Plano técnico e esquema do banco: [`docs/FASE_0_PLANO.md`](docs/FASE_0_PLANO.md)

Stack: Next.js 16 (App Router) · Supabase (Postgres, Auth, Realtime, RLS) · Tailwind + shadcn/ui · Vercel.

## Rodando localmente

Pré-requisitos: Node 20+, pnpm e Docker Desktop (aberto).

```bash
pnpm install

# 1. Sobe o Supabase local (aplica migrations e o seed de frentes/itens/decisões)
pnpm exec supabase start
pnpm db:reset            # opcional: recria o banco do zero

# 2. Variáveis de ambiente
cp .env.example .env.local
pnpm exec supabase status   # copie PUBLISHABLE_KEY e SECRET_KEY para .env.local

# 3. Contas de usuário (Auth + perfis)
cp seed/pessoas.example.json seed/pessoas.local.json
pnpm seed:usuarios

# 4. App
pnpm dev                  # http://localhost:3000
```

Supabase Studio local: http://127.0.0.1:54323

### Contas de teste (somente local)

Dica: guarde as variáveis da nuvem em `.env.nuvem.local` (ignorado pelo git) e mantenha `.env.local`
apontando para o Supabase local durante o desenvolvimento.

O arquivo de exemplo usa e-mails `nome.sobrenome@exemplo.com` e a senha `TROCAR-esta-senha-1`.
Vitor Santos (`vitor.santos@exemplo.com`) é admin; os demais são líderes.
No primeiro acesso cada usuário é obrigado a trocar a senha.

## Ambientes e credenciais

|                                        | Desenvolvimento (local)                       | Produção (nuvem)                                                               |
| -------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------ |
| Onde fica                              | `.env.local`                                  | `.env.nuvem.local` (na sua máquina) e variáveis da Vercel                      |
| `NEXT_PUBLIC_SUPABASE_URL`             | `http://127.0.0.1:54321`                      | `https://ifnjvuxyaixrubuvtvmx.supabase.co`                                     |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `pnpm exec supabase status` → PUBLISHABLE_KEY | Supabase → Project Settings → API Keys → Publishable                           |
| `SUPABASE_SECRET_KEY`                  | `pnpm exec supabase status` → SECRET_KEY      | Supabase → Project Settings → API Keys → Secret (**nunca** no git nem no chat) |
| Contas                                 | `seed/pessoas.example.json` (senha de teste)  | criadas pelo admin em Admin › Usuários                                         |

As chaves "publishable" são públicas por natureza (o acesso é limitado pelo RLS). A "secret" ignora o RLS: só na sua máquina e nas variáveis da Vercel.

Criar o admin em produção (uma vez): preencha a secret em `.env.nuvem.local` e rode

```bash
pnpm seed:usuarios seed/admin.local.json --env .env.nuvem.local
```

## Comandos

| Comando                                        | O que faz                                                          |
| ---------------------------------------------- | ------------------------------------------------------------------ |
| `pnpm dev`                                     | servidor de desenvolvimento                                        |
| `pnpm build`                                   | build de produção                                                  |
| `pnpm lint` / `pnpm typecheck` / `pnpm format` | qualidade de código                                                |
| `pnpm db:reset`                                | recria o banco local (migrations + `supabase/seed.sql`)            |
| `pnpm db:types`                                | regenera `src/lib/supabase/database.types.ts`                      |
| `pnpm seed:usuarios [arquivo]`                 | cria as contas a partir de `seed/pessoas.local.json` (idempotente) |
| `pnpm test:permissoes`                         | verifica a matriz de permissões direto no banco (local)            |
| `pnpm test:recorrencia`                        | confere o cálculo da próxima ocorrência (layout Cadência)          |

## Criando o primeiro admin (produção)

Contas só são criadas por um admin — não há cadastro aberto. Para o primeiro (Vitor Santos):

1. No projeto Supabase da nuvem, em **Authentication → Sign In / Providers**, desative
   **"Allow new users to sign up"** e mantenha o provedor **Email** ativo.
2. Em **Authentication → Hooks**, ative **Customize Access Token (JWT) Claims** apontando para a
   função `public.custom_access_token_hook` (Postgres). Sem isso, o redirecionamento de troca de senha
   e de admin não funciona.
3. Aplique as migrations: `pnpm exec supabase link --project-ref <ref>` e `pnpm exec supabase db push`.
   Para os dados iniciais, rode o conteúdo de `supabase/seed.sql` no SQL Editor (uma única vez).
4. Crie `seed/pessoas.local.json` contendo **apenas** a linha do Vitor Santos, com o e-mail real,
   `"papel": "admin"` e uma senha inicial forte.
5. Aponte `.env.local` temporariamente para o projeto da nuvem (URL + secret key) e rode `pnpm seed:usuarios`.
6. Entre no app com essa senha; o sistema pedirá a troca. A partir daí, as demais contas são criadas em **Admin › Usuários**.

O arquivo `seed/pessoas.local.json` está no `.gitignore` — nunca versione e-mails e senhas reais.
O script recusa usar o arquivo de exemplo contra um Supabase que não seja local.
