/**
 * Recorrência dos itens (layout Cadência).
 *
 * - semanal: todo dia da semana escolhido, a partir da estreia (se houver);
 * - quinzenal: a cada 14 dias contados da estreia (o dia da semana é o da estreia);
 * - mensal: todo mês no dia do mês da estreia (em meses mais curtos, no último dia).
 *
 * Datas são dias locais ("aaaa-mm-dd"); "hoje" é o dia em São Paulo.
 */
import { addDays, addMonths, differenceInCalendarDays, getDaysInMonth } from "date-fns";
import type { Database } from "@/lib/supabase/database.types";
import { hoje, paraData } from "@/lib/datas";

export type Recorrencia = Database["public"]["Enums"]["recorrencia"];

export const ROTULO_RECORRENCIA: Record<Recorrencia, string> = {
  nenhuma: "Sem recorrência",
  semanal: "Semanal",
  quinzenal: "Quinzenal",
  mensal: "Mensal",
};
export const RECORRENCIAS = Object.keys(ROTULO_RECORRENCIA) as Recorrencia[];

/** Domingo = 0 (igual a Date.getDay() e à coluna recorrencia_dia_semana). */
export const DIAS_SEMANA = [
  "domingo",
  "segunda",
  "terça",
  "quarta",
  "quinta",
  "sexta",
  "sábado",
] as const;
export const DIAS_SEMANA_CURTO = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"] as const;

/** Ordem de exibição: segunda a domingo. */
export const ORDEM_SEMANA = [1, 2, 3, 4, 5, 6, 0] as const;

/** Sugestões de canais no formulário (o campo aceita qualquer texto). */
export const CANAIS_SUGERIDOS = ["Instagram", "YouTube", "Spotify", "TikTok", "WhatsApp"];

export type DadosRecorrencia = {
  recorrencia: Recorrencia;
  recorrencia_dia_semana: number | null;
  recorrencia_estreia: string | null;
};

const artigo = (dia: number) => (dia === 0 || dia === 6 ? "todo" : "toda");

/** "toda terça", "a cada 2 semanas, às terças", "todo dia 6". Nulo quando não há recorrência. */
export function descreverCadencia(r: DadosRecorrencia): string | null {
  const estreia = r.recorrencia_estreia ? paraData(r.recorrencia_estreia) : null;
  switch (r.recorrencia) {
    case "semanal": {
      const dia = r.recorrencia_dia_semana ?? estreia?.getDay();
      return dia == null ? "Semanal" : `${artigo(dia)} ${DIAS_SEMANA[dia]}`;
    }
    case "quinzenal": {
      if (!estreia) return "Quinzenal";
      const dia = DIAS_SEMANA[estreia.getDay()];
      return `a cada 2 semanas, ${estreia.getDay() === 0 || estreia.getDay() === 6 ? "aos" : "às"} ${dia}s`;
    }
    case "mensal":
      return estreia ? `todo dia ${estreia.getDate()}` : "Mensal";
    default:
      return null;
  }
}

/** Dia `dia` do mês de `base`, limitado ao último dia do mês. */
function diaDoMes(base: Date, dia: number): Date {
  return new Date(base.getFullYear(), base.getMonth(), Math.min(dia, getDaysInMonth(base)));
}

/**
 * Primeira ocorrência em `a partir de` ou depois (padrão: hoje). Nulo quando não
 * há recorrência ou faltam dados para calcular.
 */
export function proximaOcorrencia(r: DadosRecorrencia, aPartirDe: Date = hoje()): Date | null {
  const estreia = r.recorrencia_estreia ? paraData(r.recorrencia_estreia) : null;
  const inicio = estreia && estreia > aPartirDe ? estreia : aPartirDe;

  switch (r.recorrencia) {
    case "semanal": {
      const dia = r.recorrencia_dia_semana ?? estreia?.getDay();
      if (dia == null) return null;
      return addDays(inicio, (dia - inicio.getDay() + 7) % 7);
    }
    case "quinzenal": {
      if (!estreia) return null;
      const passados = differenceInCalendarDays(inicio, estreia);
      return addDays(estreia, Math.ceil(passados / 14) * 14);
    }
    case "mensal": {
      if (!estreia) return null;
      const dia = estreia.getDate();
      const desteMes = diaDoMes(inicio, dia);
      return desteMes >= inicio ? desteMes : diaDoMes(addMonths(inicio, 1), dia);
    }
    default:
      return null;
  }
}

/** Ocorrências entre `de` e `ate` (inclusive). */
export function ocorrenciasEntre(r: DadosRecorrencia, de: Date, ate: Date): Date[] {
  const datas: Date[] = [];
  let atual = proximaOcorrencia(r, de);
  while (atual && atual <= ate) {
    datas.push(atual);
    atual = proximaOcorrencia(r, addDays(atual, 1));
  }
  return datas;
}

/** "hoje", "amanhã", "em 3 dias" — para destacar a próxima ocorrência. */
export function distanciaEmDias(data: Date, base: Date = hoje()): string {
  const dias = differenceInCalendarDays(data, base);
  if (dias === 0) return "hoje";
  if (dias === 1) return "amanhã";
  return `em ${dias} dias`;
}

/** Normaliza o dia da semana para gravar: quinzenal/mensal usam o da estreia. */
export function diaSemanaParaBanco(r: DadosRecorrencia): number | null {
  if (r.recorrencia === "nenhuma") return null;
  if (r.recorrencia === "semanal") return r.recorrencia_dia_semana;
  return r.recorrencia_estreia ? paraData(r.recorrencia_estreia).getDay() : null;
}
