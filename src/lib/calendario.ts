/**
 * Conversão entre itens e eventos do calendário da Visão geral.
 *
 * Datas são locais e sem fuso ("aaaa-mm-dd" e "HH:mm"), como no resto do app.
 * No calendário, o fim de um evento de dia inteiro é exclusivo (dia seguinte).
 */
import { addDays, addMinutes, differenceInCalendarDays, format } from "date-fns";
import { hhmm, paraData, paraIso, type DataItem } from "@/lib/datas";

/** Como um item com dia definido aparece no calendário. */
export type PosicaoEvento = {
  inicio: string;
  fim?: string;
  diaInteiro: boolean;
  /** Tem hora de início mas não de término: o fim mostrado é só visual. */
  semHoraFim: boolean;
  /** Dias entre o início e o fim do item (0 = mesmo dia). */
  dias: number;
};

/** Nova data de um item, no formato da action `moverItem`. */
export type NovaData = {
  inicio: string;
  fim: string;
  hora: string | null;
  horaFim: string | null;
};

const horaDe = (d: Date) => format(d, "HH:mm");

/** Posição no calendário de um item com data exata ou intervalo; nulo para os demais. */
export function posicaoDoItem(item: DataItem): PosicaoEvento | null {
  const { data_precisao: p, data_inicio: ini } = item;
  if ((p !== "exata" && p !== "intervalo") || !ini) return null;
  const fim = item.data_fim ?? ini;
  const dias = differenceInCalendarDays(paraData(fim), paraData(ini));

  if (!item.data_hora) {
    return {
      inicio: ini,
      fim: paraIso(addDays(paraData(fim), 1)),
      diaInteiro: true,
      semHoraFim: false,
      dias,
    };
  }
  const inicio = `${ini}T${hhmm(item.data_hora)}`;
  if (item.data_hora_fim) {
    return {
      inicio,
      fim: `${fim}T${hhmm(item.data_hora_fim)}`,
      diaInteiro: false,
      semHoraFim: false,
      dias,
    };
  }
  // Sem término: num dia só, o calendário usa a duração padrão; num intervalo,
  // vai até o fim do último dia.
  return {
    inicio,
    fim: dias > 0 ? `${fim}T23:59` : undefined,
    diaInteiro: false,
    semHoraFim: true,
    dias,
  };
}

/**
 * Nova data a partir de onde o evento ficou no calendário.
 *
 * @param original posição antes de mover (nula para itens que ainda não tinham dia).
 * @param redimensionou o usuário puxou a borda (definiu o término de propósito).
 */
export function novaDataDoEvento(
  inicio: Date,
  fim: Date | null,
  diaInteiro: boolean,
  original: PosicaoEvento | null = null,
  redimensionou = false,
): NovaData {
  const dia = paraIso(inicio);
  if (diaInteiro) {
    const ultimo = fim ? addDays(fim, -1) : inicio;
    return {
      inicio: dia,
      fim: paraIso(ultimo < inicio ? inicio : ultimo),
      hora: null,
      horaFim: null,
    };
  }

  const hora = horaDe(inicio);
  // Continua sem término se só foi arrastado (mantém a quantidade de dias).
  if (!fim || (original?.semHoraFim && !original.diaInteiro && !redimensionou)) {
    const dias = original && !original.diaInteiro ? original.dias : 0;
    return { inicio: dia, fim: paraIso(addDays(inicio, dias)), hora, horaFim: null };
  }

  // Terminar à meia-noite = até o fim do dia anterior.
  const termino = horaDe(fim) === "00:00" && fim > inicio ? addMinutes(fim, -1) : fim;
  const ultimo = paraIso(termino);
  const horaFim = horaDe(termino);
  if (ultimo === dia && horaFim <= hora) return { inicio: dia, fim: dia, hora, horaFim: null };
  return { inicio: dia, fim: ultimo, hora, horaFim };
}

/** Campos do item como ficam no banco depois de mover (para mostrar na hora, antes da resposta). */
export function camposDaNovaData(d: NovaData) {
  return {
    data_precisao: d.inicio === d.fim ? ("exata" as const) : ("intervalo" as const),
    data_inicio: d.inicio,
    data_fim: d.fim,
    data_hora: d.hora ? `${d.hora}:00` : null,
    data_hora_fim: d.hora && d.horaFim ? `${d.horaFim}:00` : null,
    data_periodo: null,
  };
}
