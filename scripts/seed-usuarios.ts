/**
 * Cria as contas (Supabase Auth + perfis) a partir de um arquivo JSON.
 *
 *   pnpm seed:usuarios                       → usa seed/pessoas.local.json
 *   pnpm seed:usuarios seed/outro.json       → usa outro arquivo
 *
 * É idempotente: quem já tem conta (mesmo e-mail) é pulado.
 * Também serve para criar o primeiro admin em produção: deixe no arquivo só
 * a linha do Vitor Santos com papel "admin".
 *
 * Usa SUPABASE_SECRET_KEY (privilegiada) — rode apenas na sua máquina.
 */
import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

config({ path: ".env.local" });

const pessoaSchema = z.object({
  nome: z.string().trim().min(1),
  email: z.email(),
  regiao: z.enum(["SP", "Nordeste", "SP_Nordeste"]),
  papel: z.enum(["admin", "lider"]),
  senha_inicial: z.string().min(8),
});

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/);
  const primeira = partes[0][0];
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (primeira + ultima).toUpperCase();
}

async function main() {
  const arquivo = process.argv[2] ?? "seed/pessoas.local.json";
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.SUPABASE_SECRET_KEY;
  if (!url || !chave) {
    throw new Error("Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SECRET_KEY em .env.local.");
  }

  const local = /^https?:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(url);
  if (basename(arquivo).includes("example") && !local) {
    throw new Error("O arquivo de exemplo só pode ser usado no Supabase local.");
  }

  const pessoas = z.array(pessoaSchema).parse(JSON.parse(readFileSync(arquivo, "utf8")));
  const supabase = createClient(url, chave, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: existentes, error: erroPerfis } = await supabase.from("perfis").select("email");
  if (erroPerfis) throw erroPerfis;
  const jaExiste = new Set(existentes.map((p) => p.email.toLowerCase()));

  let criados = 0;
  for (const p of pessoas) {
    const email = p.email.toLowerCase();
    if (jaExiste.has(email)) {
      console.log(`• ${p.nome} já tem conta — pulando`);
      continue;
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: p.senha_inicial,
      email_confirm: true,
      user_metadata: { nome: p.nome },
    });
    if (error) throw new Error(`Falha ao criar ${p.nome}: ${error.message}`);

    const { error: erroPerfil } = await supabase.from("perfis").insert({
      id: data.user.id,
      nome: p.nome,
      email,
      iniciais: iniciais(p.nome),
      regiao: p.regiao,
      papel: p.papel,
      precisa_trocar_senha: true,
    });
    if (erroPerfil) {
      await supabase.auth.admin.deleteUser(data.user.id);
      throw new Error(`Falha ao criar perfil de ${p.nome}: ${erroPerfil.message}`);
    }

    criados++;
    console.log(`✓ ${p.nome} (${p.papel})`);
  }

  console.log(`\n${criados} conta(s) criada(s).`);
}

main().catch((erro) => {
  console.error(erro instanceof Error ? erro.message : erro);
  process.exit(1);
});
