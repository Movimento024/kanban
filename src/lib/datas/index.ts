/**
 * Datas do planejamento. Datas "de calendário" chegam do banco como "aaaa-mm-dd"
 * (sem fuso) e são tratadas como dias locais; "hoje" é sempre o dia em São Paulo.
 */
import {
  addMonths,
  differenceInCalendarMonths,
  endOfMonth,
  format,
  getDaysInMonth,
  parseISO,
  startOfMonth,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { TZDate } from "@date-fns/tz";
import type { Database } from "@/lib/supabase/database.types";

export const FUSO = "America/Sao_Paulo";

type Enums = Database["public"]["Enums"];
export type PrecisaoData = Enums["precisao_data"];
export type PeriodoAno = Enums["periodo_ano"];

export const ROTULO_PRECISAO: Record<PrecisaoData, string> = {
  exata: "Dia",
  intervalo: "Intervalo",
  mes: "Mês",
  periodo: "Período",
  a_definir: "A definir",
};
export const PRECISOES = Object.keys(ROTULO_PRECISAO) as PrecisaoData[];

export const ROTULO_PERIODO: Record<PeriodoAno, string> = {
  s1: "1º semestre",
  s2: "2º semestre",
  t1: "1º trimestre",
  t2: "2º trimestre",
  t3: "3º trimestre",
  t4: "4º trimestre",
  meio_ano: "Meio do ano",
};
export const PERIODOS = Object.keys(ROTULO_PERIODO) as PeriodoAno[];

/** Meses (1–12) de início e fim de cada período. Igual à função normalizar_data_item do banco. */
export const MESES_PERIODO: Record<PeriodoAno, [number, number]> = {
  s1: [1, 6],
  s2: [7, 12],
  t1: [1, 3],
  t2: [4, 6],
  t3: [7, 9],
  t4: [10, 12],
  meio_ano: [6, 8],
};

/** Data local a partir de "aaaa-mm-dd". */
export function paraData(iso: string): Date {
  return parseISO(iso);
}

/** "aaaa-mm-dd" de uma data local. */
export function paraIso(data: Date): string {
  return format(data, "yyyy-MM-dd");
}

/** Hoje em São Paulo, como data local (meia-noite). */
export function hoje(): Date {
  const agora = TZDate.tz(FUSO);
  return new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
}

export function hojeIso(): string {
  return paraIso(hoje());
}

const capitalizar = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** "Janeiro/2027" */
export function rotuloMes(data: Date): string {
  return capitalizar(format(data, "MMMM/yyyy", { locale: ptBR }));
}

/** "jan" */
export function rotuloMesCurto(data: Date): string {
  return format(data, "MMM", { locale: ptBR }).replace(".", "");
}

export type DataItem = {
  data_precisao: PrecisaoData;
  data_inicio: string | null;
  data_fim: string | null;
  data_hora?: string | null;
  data_hora_fim?: string | null;
  data_periodo: PeriodoAno | null;
};

/** "19:00" a partir de "19:00:00". */
export function hhmm(hora: string): string {
  return hora.slice(0, 5);
}

/** Data formatada conforme a precisão, ex.: "15/11/2026", "Janeiro/2027", "1º semestre de 2027". */
export function formatarDataItem(item: DataItem): string {
  const { data_precisao: p, data_inicio: ini, data_fim: fim } = item;
  if (p === "a_definir" || !ini) return "Data a definir";

  const inicio = paraData(ini);
  switch (p) {
    case "exata": {
      const dia = format(inicio, "dd/MM/yyyy");
      if (!item.data_hora) return dia;
      const fimHora = item.data_hora_fim ? `–${hhmm(item.data_hora_fim)}` : "";
      return `${dia} · ${hhmm(item.data_hora)}${fimHora}`;
    }
    case "intervalo": {
      const f = paraData(fim ?? ini);
      if (item.data_hora) {
        const fimHora = item.data_hora_fim ? ` ${hhmm(item.data_hora_fim)}` : "";
        return `${format(inicio, "dd/MM/yyyy")} ${hhmm(item.data_hora)} a ${format(f, "dd/MM/yyyy")}${fimHora}`;
      }
      if (format(inicio, "MM/yyyy") === format(f, "MM/yyyy")) {
        return `${format(inicio, "dd")} a ${format(f, "dd/MM/yyyy")}`;
      }
      return `${format(inicio, "dd/MM/yyyy")} a ${format(f, "dd/MM/yyyy")}`;
    }
    case "mes":
      return rotuloMes(inicio);
    case "periodo": {
      const ano = inicio.getFullYear();
      if (item.data_periodo === "meio_ano") return `Meio de ${ano}`;
      return item.data_periodo ? `${ROTULO_PERIODO[item.data_periodo]} de ${ano}` : String(ano);
    }
  }
}

/** Calcula data_inicio/data_fim como o banco faria (para pré-visualizar e posicionar). */
export function normalizarIntervalo(
  precisao: PrecisaoData,
  inicio: string | null,
  fim: string | null,
  periodo: PeriodoAno | null,
): { inicio: string | null; fim: string | null } {
  if (precisao === "a_definir" || !inicio) return { inicio: null, fim: null };
  const d = paraData(inicio);
  switch (precisao) {
    case "exata":
      return { inicio, fim: inicio };
    case "intervalo":
      return { inicio, fim: fim ?? inicio };
    case "mes":
      return { inicio: paraIso(startOfMonth(d)), fim: paraIso(endOfMonth(d)) };
    case "periodo": {
      if (!periodo) return { inicio: null, fim: null };
      const [m1, m2] = MESES_PERIODO[periodo];
      const ano = d.getFullYear();
      return {
        inicio: paraIso(new Date(ano, m1 - 1, 1)),
        fim: paraIso(endOfMonth(new Date(ano, m2 - 1, 1))),
      };
    }
  }
}

/** Lista de meses (primeiro dia) de `de` até `ate`, inclusive. */
export function mesesEntre(de: Date, ate: Date): Date[] {
  const inicio = startOfMonth(de);
  const total = differenceInCalendarMonths(ate, inicio);
  return Array.from({ length: total + 1 }, (_, i) => addMonths(inicio, i));
}

/**
 * Posição fracionária de uma data numa régua de meses (0 = início do primeiro mês).
 * `fimDoDia` posiciona no fim do dia (para o lado direito de uma barra).
 */
export function posicaoNaRegua(primeiroMes: Date, data: Date, fimDoDia = false): number {
  const mes = differenceInCalendarMonths(data, primeiroMes);
  const dias = getDaysInMonth(data);
  return mes + (data.getDate() - (fimDoDia ? 0 : 1)) / dias;
}

/** Anos oferecidos nos seletores de período. */
export function anosDoPlanejamento(): number[] {
  const atual = hoje().getFullYear();
  return [atual, atual + 1, atual + 2, atual + 3];
}

/** "ter, 13/10" (ano só quando não é o atual). */
export function formatarDiaCurto(data: Date): string {
  const semana = format(data, "EEE", { locale: ptBR }).replace(".", "");
  const ano = data.getFullYear() === hoje().getFullYear() ? "" : `/${data.getFullYear()}`;
  return `${semana}, ${format(data, "dd/MM")}${ano}`;
}

/** "06/10/2026" a partir de "aaaa-mm-dd". */
export function formatarDiaIso(iso: string): string {
  return format(paraData(iso), "dd/MM/yyyy");
}
