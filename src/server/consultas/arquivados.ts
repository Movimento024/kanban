import "server-only";
import { criarClienteServidor } from "@/lib/supabase/server";

export type TipoArquivado = "itens" | "tarefas" | "decisoes" | "decisao_opcoes" | "notas";

export type Arquivado = {
  tipo: TipoArquivado;
  id: string;
  titulo: string;
  onde: string;
  arquivadoEm: string;
};

/** Tudo o que está arquivado (frentes ficam em Admin › Frentes), mais recentes primeiro. */
export async function listarArquivados(): Promise<Arquivado[]> {
  const sb = await criarClienteServidor();
  const [itens, tarefas, decisoes, opcoes, notas] = await Promise.all([
    sb
      .from("itens")
      .select("id, titulo, archived_at, frente:frentes ( nome )")
      .not("archived_at", "is", null),
    sb
      .from("tarefas")
      .select("id, titulo, archived_at, item:itens ( titulo )")
      .not("archived_at", "is", null),
    sb
      .from("decisoes")
      .select("id, pergunta, archived_at, item:itens ( titulo )")
      .not("archived_at", "is", null),
    sb
      .from("decisao_opcoes")
      .select(
        "id, texto, archived_at, decisao:decisoes!decisao_opcoes_decisao_id_fkey ( pergunta )",
      )
      .not("archived_at", "is", null),
    sb
      .from("notas")
      .select("id, texto, archived_at, item:itens ( titulo )")
      .not("archived_at", "is", null),
  ]);

  const lista: Arquivado[] = [
    ...(itens.data ?? []).map((x) => ({
      tipo: "itens" as const,
      id: x.id,
      titulo: x.titulo,
      onde: `Frente ${x.frente?.nome ?? "—"}`,
      arquivadoEm: x.archived_at!,
    })),
    ...(tarefas.data ?? []).map((x) => ({
      tipo: "tarefas" as const,
      id: x.id,
      titulo: x.titulo,
      onde: `Item ${x.item?.titulo ?? "—"}`,
      arquivadoEm: x.archived_at!,
    })),
    ...(decisoes.data ?? []).map((x) => ({
      tipo: "decisoes" as const,
      id: x.id,
      titulo: x.pergunta,
      onde: `Item ${x.item?.titulo ?? "—"}`,
      arquivadoEm: x.archived_at!,
    })),
    ...(opcoes.data ?? []).map((x) => ({
      tipo: "decisao_opcoes" as const,
      id: x.id,
      titulo: x.texto,
      onde: `Decisão ${x.decisao?.pergunta ?? "—"}`,
      arquivadoEm: x.archived_at!,
    })),
    ...(notas.data ?? []).map((x) => ({
      tipo: "notas" as const,
      id: x.id,
      titulo: x.texto.length > 90 ? `${x.texto.slice(0, 90)}…` : x.texto,
      onde: `Item ${x.item?.titulo ?? "—"}`,
      arquivadoEm: x.archived_at!,
    })),
  ];
  return lista.sort((a, b) => b.arquivadoEm.localeCompare(a.arquivadoEm));
}
