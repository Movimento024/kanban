import type { Database } from "@/lib/supabase/database.types";

type Enums = Database["public"]["Enums"];

export type Papel = Enums["papel_usuario"];
export type RegiaoPessoa = Enums["regiao_pessoa"];

export const ROTULO_PAPEL: Record<Papel, string> = {
  admin: "Admin",
  lider: "Líder",
};

export const ROTULO_REGIAO_PESSOA: Record<RegiaoPessoa, string> = {
  SP: "SP",
  Nordeste: "Nordeste",
  SP_Nordeste: "SP e Nordeste",
};

export const PAPEIS = Object.keys(ROTULO_PAPEL) as Papel[];
export const REGIOES_PESSOA = Object.keys(ROTULO_REGIAO_PESSOA) as RegiaoPessoa[];

export const SENHA_MINIMA = 8;

/**
 * Cores de região, consistentes em todo o app (seção 9).
 * SP = índigo, Nordeste = verde-azulado, Nacional = violeta.
 * Classes completas (Tailwind precisa enxergá-las literalmente).
 */
export const COR_REGIAO_PESSOA: Record<RegiaoPessoa, string> = {
  SP: "bg-indigo-600 text-white dark:bg-indigo-500",
  Nordeste: "bg-teal-600 text-white dark:bg-teal-500",
  SP_Nordeste: "bg-gradient-to-br from-indigo-600 to-teal-600 text-white",
};

export type StatusItem = Enums["status_item"];
export type RegiaoItem = Enums["regiao_item"];
export type LayoutFrente = Enums["layout_frente"];

export const ROTULO_STATUS: Record<StatusItem, string> = {
  ideia: "Ideia",
  em_definicao: "Em definição",
  confirmado: "Confirmado",
  realizado: "Realizado",
  cancelado: "Cancelado",
};
export const STATUS = Object.keys(ROTULO_STATUS) as StatusItem[];

/** Cores de status (seção 9): ideia cinza, em definição âmbar, confirmado verde, realizado azul, cancelado vermelho riscado. */
export const COR_STATUS: Record<StatusItem, { badge: string; ponto: string }> = {
  ideia: {
    badge: "bg-zinc-500/15 text-zinc-700 dark:text-zinc-300",
    ponto: "bg-zinc-400",
  },
  em_definicao: {
    badge: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
    ponto: "bg-amber-500",
  },
  confirmado: {
    badge: "bg-green-500/15 text-green-800 dark:text-green-300",
    ponto: "bg-green-600",
  },
  realizado: {
    badge: "bg-blue-500/15 text-blue-800 dark:text-blue-300",
    ponto: "bg-blue-600",
  },
  cancelado: {
    badge: "bg-red-500/15 text-red-800 line-through dark:text-red-300",
    ponto: "bg-red-600",
  },
};

export const ROTULO_REGIAO_ITEM: Record<RegiaoItem, string> = {
  SP: "SP",
  Nordeste: "Nordeste",
  Nacional: "Nacional",
};
export const REGIOES_ITEM = Object.keys(ROTULO_REGIAO_ITEM) as RegiaoItem[];

export const COR_REGIAO_ITEM: Record<RegiaoItem, string> = {
  SP: "bg-indigo-500/15 text-indigo-800 dark:text-indigo-300",
  Nordeste: "bg-teal-500/15 text-teal-800 dark:text-teal-300",
  Nacional: "bg-violet-500/15 text-violet-800 dark:text-violet-300",
};

export const ROTULO_LAYOUT: Record<LayoutFrente, string> = {
  linha_do_tempo: "Linha do tempo",
  cadencia: "Cadência",
  lista: "Lista",
};
export const DESCRICAO_LAYOUT: Record<LayoutFrente, string> = {
  linha_do_tempo: "Itens datados no tempo, em raias por região. Ex.: Eventos, Ações.",
  cadencia: "Cards de conteúdos recorrentes, com a próxima data. Ex.: Digital.",
  lista: "Lista simples, ordenável e agrupável por status. Ex.: Loja.",
};
export const LAYOUTS = Object.keys(ROTULO_LAYOUT) as LayoutFrente[];
