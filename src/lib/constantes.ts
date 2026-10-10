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
