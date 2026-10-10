import "server-only";
import { criarClienteServidor } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import type { PessoaResumo } from "@/server/consultas/itens";

type T = Database["public"]["Tables"];

export type ItemCompleto = T["itens"]["Row"] & {
  frente: Pick<T["frentes"]["Row"], "id" | "nome" | "cor" | "icone" | "layout"> | null;
};
export type Atribuicao = Pick<T["atribuicoes"]["Row"], "id" | "papel" | "created_at"> & {
  pessoa: PessoaResumo;
};
export type Tarefa = T["tarefas"]["Row"];
export type Opcao = T["decisao_opcoes"]["Row"];
export type Decisao = T["decisoes"]["Row"] & { opcoes: Opcao[] };
export type Nota = T["notas"]["Row"] & {
  autor: Pick<PessoaResumo, "id" | "nome" | "iniciais" | "regiao"> | null;
};
export type Atividade = T["atividades"]["Row"] & { ator: { nome: string } | null };

export type DetalheItem = {
  item: ItemCompleto;
  atribuicoes: Atribuicao[];
  tarefas: Tarefa[];
  decisoes: Decisao[];
  notas: Nota[];
  atividades: Atividade[];
  pessoas: PessoaResumo[];
};

const porOrdem = <X extends { ordem: number; created_at: string }>(a: X, b: X) =>
  a.ordem - b.ordem || a.created_at.localeCompare(b.created_at);

/** Tudo o que o painel do item precisa. Retorna null se não existir ou estiver arquivado. */
export async function obterDetalheItem(id: string): Promise<DetalheItem | null> {
  const supabase = await criarClienteServidor();

  const [item, atribuicoes, tarefas, decisoes, notas, atividades, pessoas] = await Promise.all([
    supabase
      .from("itens")
      .select("*, frente:frentes ( id, nome, cor, icone, layout )")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("atribuicoes")
      .select(
        "id, papel, created_at, pessoa:perfis!atribuicoes_pessoa_id_fkey ( id, nome, iniciais, regiao, ativo )",
      )
      .eq("item_id", id),
    supabase.from("tarefas").select("*").eq("item_id", id).is("archived_at", null),
    supabase
      .from("decisoes")
      .select("*, opcoes:decisao_opcoes!decisao_opcoes_decisao_id_fkey ( * )")
      .eq("item_id", id)
      .is("archived_at", null),
    supabase
      .from("notas")
      .select("*, autor:perfis ( id, nome, iniciais, regiao )")
      .eq("item_id", id)
      .is("archived_at", null)
      .order("created_at"),
    supabase
      .from("atividades")
      .select("*, ator:perfis ( nome )")
      .eq("item_id", id)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("perfis")
      .select("id, nome, iniciais, regiao, ativo")
      .eq("ativo", true)
      .order("nome"),
  ]);

  if (!item.data || item.data.archived_at) return null;

  // Subtarefas cujo pai foi arquivado também saem do painel.
  const ativas = new Set((tarefas.data ?? []).map((t) => t.id));
  return {
    item: item.data,
    atribuicoes: (atribuicoes.data ?? []).sort(
      (a, b) =>
        Number(b.papel === "responsavel") - Number(a.papel === "responsavel") ||
        a.pessoa.nome.localeCompare(b.pessoa.nome),
    ),
    tarefas: (tarefas.data ?? [])
      .filter((t) => !t.parent_id || ativas.has(t.parent_id))
      .sort(porOrdem),
    decisoes: (decisoes.data ?? []).sort(porOrdem).map((d) => ({
      ...d,
      // A opção escolhida continua visível mesmo se for arquivada depois.
      opcoes: d.opcoes
        .filter((o) => !o.archived_at || o.id === d.opcao_escolhida_id)
        .sort(porOrdem),
    })),
    notas: notas.data ?? [],
    atividades: atividades.data ?? [],
    pessoas: pessoas.data ?? [],
  };
}
