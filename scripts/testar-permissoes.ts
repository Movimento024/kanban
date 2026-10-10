/**
 * Verifica a matriz de permissões direto no banco (sem passar pela UI).
 * Requer Supabase local com o seed e `pnpm seed:usuarios` usando o arquivo de exemplo.
 *
 *   pnpm test:permissoes
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/lib/supabase/database.types";

config({ path: ".env.local" });

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const CHAVE = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const SENHA = "TROCAR-esta-senha-1";
const ITEM = "00000000-0000-4000-b000-000000000001"; // Evento SP 2026

let falhas = 0;
function verificar(descricao: string, ok: boolean, detalhe?: string) {
  console.log(`${ok ? "✓" : "✗"} ${descricao}${!ok && detalhe ? ` — ${detalhe}` : ""}`);
  if (!ok) falhas++;
}

async function entrar(email: string) {
  const c = createClient<Database>(URL, CHAVE, { auth: { persistSession: false } });
  const { error } = await c.auth.signInWithPassword({ email, password: SENHA });
  if (error) throw new Error(`Login de ${email} falhou: ${error.message}`);
  return c;
}

async function main() {
  const anonimo = createClient<Database>(URL, CHAVE, { auth: { persistSession: false } });
  const { data: anon } = await anonimo.from("itens").select("id");
  verificar("Anônimo não vê itens", (anon ?? []).length === 0);

  const lider = await entrar("caio.santos@exemplo.com");
  const admin = await entrar("vitor.santos@exemplo.com");
  const { data: caio } = await lider.auth.getUser();

  // Líder: pode ler, criar, editar, atribuir e desatribuir
  const { data: itens } = await lider.from("itens").select("id");
  verificar("Líder vê os itens", (itens ?? []).length > 0);

  const { data: novo, error: eCriar } = await lider
    .from("itens")
    .insert({
      frente_id: "00000000-0000-4000-a000-000000000001",
      titulo: "Teste permissões",
      regiao: "SP",
    })
    .select()
    .single();
  verificar("Líder cria item", !eCriar && !!novo, eCriar?.message);

  const { error: eEditar } = await lider
    .from("itens")
    .update({ local: "Teste" })
    .eq("id", novo!.id);
  verificar("Líder edita item", !eEditar, eEditar?.message);

  const { error: eAtrib } = await lider
    .from("atribuicoes")
    .insert({ item_id: novo!.id, pessoa_id: caio.user!.id, papel: "responsavel" });
  verificar("Líder se atribui", !eAtrib, eAtrib?.message);

  const { error: eDesatrib, count } = await lider
    .from("atribuicoes")
    .delete({ count: "exact" })
    .eq("item_id", novo!.id);
  verificar("Líder se desatribui", !eDesatrib && count === 1, eDesatrib?.message);

  // Líder: não pode arquivar, restaurar nem excluir
  const { error: eArq } = await lider
    .from("itens")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", ITEM);
  verificar("Líder NÃO arquiva item", !!eArq);

  const { error: eArqFrente } = await lider
    .from("frentes")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", "00000000-0000-4000-a000-000000000004");
  verificar("Líder NÃO arquiva frente", !!eArqFrente);

  const { count: excluidos } = await lider.from("itens").delete({ count: "exact" }).eq("id", ITEM);
  verificar("Líder NÃO exclui item", excluidos === 0);

  const { count: notasExcl } = await lider.from("notas").delete({ count: "exact" }).neq("id", ITEM);
  verificar("Líder NÃO exclui notas", notasExcl === 0);

  const { error: ePapel } = await lider
    .from("perfis")
    .update({ papel: "admin" })
    .eq("id", caio.user!.id);
  verificar("Líder NÃO se promove a admin", !!ePapel);

  const { error: eAtiv } = await lider
    .from("atividades")
    .insert({ acao: "criou", entidade: "item", entidade_id: ITEM });
  verificar("Líder NÃO escreve no histórico", !!eAtiv);

  // Admin: arquiva, restaura e exclui
  const { error: aArq } = await admin
    .from("itens")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", novo!.id);
  verificar("Admin arquiva item", !aArq, aArq?.message);

  const { error: lRest } = await lider
    .from("itens")
    .update({ archived_at: null })
    .eq("id", novo!.id);
  verificar("Líder NÃO restaura item", !!lRest);

  const { error: aRest } = await admin
    .from("itens")
    .update({ archived_at: null })
    .eq("id", novo!.id);
  verificar("Admin restaura item", !aRest, aRest?.message);

  const { count: aExcl } = await admin.from("itens").delete({ count: "exact" }).eq("id", novo!.id);
  verificar("Admin exclui item", aExcl === 1);

  // Histórico
  const { data: hist } = await admin
    .from("atividades")
    .select("acao")
    .eq("item_id", novo!.id)
    .order("id");
  const acoes = (hist ?? []).map((h) => h.acao).join(",");
  verificar(
    "Histórico registrou tudo",
    acoes === "criou,editou,atribuiu,desatribuiu,arquivou,restaurou,excluiu",
    acoes,
  );

  console.log(
    falhas ? `\n${falhas} verificação(ões) falharam.` : "\nTodas as verificações passaram.",
  );
  process.exit(falhas ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
