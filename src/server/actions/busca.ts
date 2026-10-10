"use server";

import { criarClienteServidor } from "@/lib/supabase/server";
import { formatarDataItem } from "@/lib/datas";
import { listarItensAtivos } from "@/server/consultas/itens";
import { listarFrentes } from "@/server/consultas/frentes";
import { falha, sucesso, type Resultado } from "@/server/resultado";
import { obterPerfilAtual } from "@/server/sessao";

export type IndiceBusca = {
  itens: { id: string; titulo: string; detalhe: string; frente: string }[];
  frentes: { id: string; nome: string }[];
  pessoas: { id: string; nome: string }[];
};

/** O que a busca da barra superior procura: itens, frentes e pessoas ativos. */
export async function carregarIndiceBusca(): Promise<Resultado<IndiceBusca>> {
  if (!(await obterPerfilAtual())) return falha("Sua sessão expirou. Entre de novo.");
  try {
    const supabase = await criarClienteServidor();
    const [itens, frentes, pessoas] = await Promise.all([
      listarItensAtivos(),
      listarFrentes(),
      supabase.from("perfis").select("id, nome").eq("ativo", true).order("nome"),
    ]);
    const nomeFrente = new Map(frentes.map((f) => [f.id, f.nome]));
    return sucesso({
      itens: itens.map((i) => ({
        id: i.id,
        titulo: i.titulo,
        detalhe: [formatarDataItem(i), i.local, i.responsavel?.nome].filter(Boolean).join(" · "),
        frente: nomeFrente.get(i.frente_id) ?? "",
      })),
      frentes: frentes.map((f) => ({ id: f.id, nome: f.nome })),
      pessoas: pessoas.data ?? [],
    });
  } catch {
    return falha("Não foi possível carregar a busca. Tente de novo.");
  }
}
