import "server-only";
import { criarClienteServidor } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { listarItensAtivos, type ItemResumo, type PessoaResumo } from "@/server/consultas/itens";

type T = Database["public"]["Tables"];

export type TarefaResumo = Pick<
  T["tarefas"]["Row"],
  "id" | "titulo" | "concluida" | "prazo" | "responsavel_id" | "item_id" | "parent_id"
>;
export type DecisaoResumo = Pick<T["decisoes"]["Row"], "id" | "pergunta" | "prazo" | "item_id">;

/** Tudo o que a Visão geral e o Por líder precisam, das frentes ativas. */
export type Panorama = {
  itens: ItemResumo[];
  tarefas: TarefaResumo[];
  decisoesAbertas: DecisaoResumo[];
  pessoas: PessoaResumo[];
  limiteSobrecarga: number;
};

export const LIMITE_SOBRECARGA_PADRAO = 5;

export async function obterPanorama(): Promise<Panorama> {
  const supabase = await criarClienteServidor();
  const [itens, tarefas, decisoes, pessoas, limite] = await Promise.all([
    listarItensAtivos(),
    supabase
      .from("tarefas")
      .select("id, titulo, concluida, prazo, responsavel_id, item_id, parent_id")
      .is("archived_at", null)
      .order("prazo", { nullsFirst: false })
      .order("ordem"),
    supabase
      .from("decisoes")
      .select("id, pergunta, prazo, item_id")
      .eq("status", "aberta")
      .is("archived_at", null)
      .order("prazo", { nullsFirst: false })
      .order("created_at"),
    supabase
      .from("perfis")
      .select("id, nome, iniciais, regiao, ativo")
      .eq("ativo", true)
      .order("nome"),
    supabase.from("configuracoes").select("valor").eq("chave", "limite_sobrecarga").maybeSingle(),
  ]);
  for (const r of [tarefas, decisoes, pessoas]) if (r.error) throw new Error(r.error.message);

  // Só o que pertence a itens ativos (de frentes ativas); subtarefa de tarefa arquivada sai junto.
  const ativos = new Set(itens.map((i) => i.id));
  const tarefasAtivas = new Set((tarefas.data ?? []).map((t) => t.id));
  const valor = Number(limite.data?.valor);

  return {
    itens,
    tarefas: (tarefas.data ?? []).filter(
      (t) => ativos.has(t.item_id) && (!t.parent_id || tarefasAtivas.has(t.parent_id)),
    ),
    decisoesAbertas: (decisoes.data ?? []).filter((d) => ativos.has(d.item_id)),
    pessoas: pessoas.data ?? [],
    limiteSobrecarga: Number.isInteger(valor) && valor > 0 ? valor : LIMITE_SOBRECARGA_PADRAO,
  };
}
