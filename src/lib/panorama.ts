/**
 * Cálculos da Visão geral e do Por líder, feitos sobre o Panorama já carregado
 * (os dados são poucos: dezenas de itens). Sem acesso ao banco: serve no cliente.
 */
import { addDays } from "date-fns";
import type { RegiaoItem, RegiaoPessoa } from "@/lib/constantes";
import { hoje, paraIso } from "@/lib/datas";
import { proximaOcorrencia } from "@/lib/recorrencia";
import type { ItemResumo } from "@/server/consultas/itens";
import type { TarefaResumo } from "@/server/consultas/panorama";

export type Carga = {
  responsavel: ItemResumo[];
  apoio: ItemResumo[];
  tarefasAbertas: number;
};

/** Itens e tarefas abertas de cada pessoa (por id). */
export function cargaPorPessoa(itens: ItemResumo[], tarefas: TarefaResumo[]): Map<string, Carga> {
  const mapa = new Map<string, Carga>();
  const de = (id: string) => {
    let c = mapa.get(id);
    if (!c) mapa.set(id, (c = { responsavel: [], apoio: [], tarefasAbertas: 0 }));
    return c;
  };
  for (const item of itens) {
    if (item.responsavel) de(item.responsavel.id).responsavel.push(item);
    for (const p of item.apoio) de(p.id).apoio.push(item);
  }
  for (const t of tarefas)
    if (t.responsavel_id && !t.concluida) de(t.responsavel_id).tarefasAbertas++;
  return mapa;
}

export const CARGA_VAZIA: Carga = { responsavel: [], apoio: [], tarefasAbertas: 0 };

export type FiltroRegiaoPessoa = "todos" | "SP" | "Nordeste";

/** Quem atua em SP e no Nordeste aparece nos dois filtros. */
export function pessoaNaRegiao(regiao: RegiaoPessoa, filtro: FiltroRegiaoPessoa): boolean {
  return filtro === "todos" || regiao === filtro || regiao === "SP_Nordeste";
}

export type FiltroRegiaoItem = "todos" | RegiaoItem;

/** Chave para ordenar por data: início, ou a próxima ocorrência; sem data vai para o fim. */
export function chaveData(item: ItemResumo, base: Date = hoje()): string {
  if (item.data_inicio) return item.data_inicio;
  const proxima = item.status === "cancelado" ? null : proximaOcorrencia(item, base);
  return proxima ? paraIso(proxima) : "9999-12-31";
}

export const porData =
  (base: Date = hoje()) =>
  (a: ItemResumo, b: ItemResumo) =>
    chaveData(a, base).localeCompare(chaveData(b, base)) || a.titulo.localeCompare(b.titulo);

/** Itens com data que encosta no intervalo [hoje, hoje + dias] (cancelados e realizados ficam de fora). */
export function itensNosProximosDias(itens: ItemResumo[], dias: number, base: Date = hoje()) {
  const de = paraIso(base);
  const ate = paraIso(addDays(base, dias));
  return itens
    .filter(
      (i) =>
        i.data_inicio &&
        i.data_fim &&
        i.status !== "cancelado" &&
        i.status !== "realizado" &&
        i.data_inicio <= ate &&
        i.data_fim >= de,
    )
    .sort(porData(base));
}

export function tarefaAtrasada(t: TarefaResumo, base: Date = hoje()): boolean {
  return !t.concluida && !!t.prazo && t.prazo < paraIso(base);
}

/** Item "pendente de dono": sem responsável e ainda relevante. */
export function semResponsavel(item: ItemResumo): boolean {
  return !item.responsavel && item.status !== "cancelado" && item.status !== "realizado";
}
