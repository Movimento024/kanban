import { z } from "zod";
import { REGIOES_ITEM, STATUS } from "@/lib/constantes";
import { PERIODOS, PRECISOES } from "@/lib/datas";

const textoOpcional = (max: number, msg: string) =>
  z
    .string()
    .trim()
    .max(max, msg)
    .optional()
    .transform((v) => v || null);

const dataIso = /^\d{4}-\d{2}-\d{2}$/;
const mesIso = /^\d{4}-\d{2}$/;

/**
 * Campos do formulário de item. A data vem em campos separados por precisão
 * (data_dia, data_inicio/data_fim, data_mes, data_ano + data_periodo) e é
 * convertida para as colunas do banco em `itemParaBanco`.
 */
export const itemSchema = z
  .object({
    titulo: z
      .string({ error: "Informe o título." })
      .trim()
      .min(2, "Informe o título.")
      .max(120, "Título muito longo (máx. 120)."),
    descricao: textoOpcional(2000, "Descrição muito longa."),
    frente_id: z.uuid({ error: "Escolha a frente." }),
    regiao: z.enum(REGIOES_ITEM, { error: "Escolha a região." }),
    local: textoOpcional(120, "Local muito longo."),
    status: z.enum(STATUS, { error: "Escolha o status." }),
    data_precisao: z.enum(PRECISOES, { error: "Escolha a precisão da data." }),
    data_dia: z.string().optional(),
    data_hora: z.string().optional(),
    data_inicio: z.string().optional(),
    data_fim: z.string().optional(),
    data_mes: z.string().optional(),
    data_ano: z.string().optional(),
    data_periodo: z.string().optional(),
    data_texto: textoOpcional(120, "Texto muito longo (máx. 120)."),
  })
  .superRefine((d, ctx) => {
    const erro = (path: string, message: string) =>
      ctx.addIssue({ code: "custom", path: [path], message });
    switch (d.data_precisao) {
      case "exata":
        if (!d.data_dia || !dataIso.test(d.data_dia)) erro("data_dia", "Informe o dia.");
        if (d.data_hora && !/^\d{2}:\d{2}$/.test(d.data_hora)) erro("data_hora", "Hora inválida.");
        break;
      case "intervalo":
        if (!d.data_inicio || !dataIso.test(d.data_inicio))
          erro("data_inicio", "Informe o início.");
        if (!d.data_fim || !dataIso.test(d.data_fim)) erro("data_fim", "Informe o fim.");
        else if (d.data_inicio && d.data_fim < d.data_inicio)
          erro("data_fim", "O fim precisa ser depois do início.");
        break;
      case "mes":
        if (!d.data_mes || !mesIso.test(d.data_mes)) erro("data_mes", "Informe o mês.");
        break;
      case "periodo":
        if (!d.data_ano || !/^\d{4}$/.test(d.data_ano)) erro("data_ano", "Informe o ano.");
        if (!d.data_periodo || !(PERIODOS as string[]).includes(d.data_periodo))
          erro("data_periodo", "Escolha o período.");
        break;
    }
  });

export type ItemForm = z.infer<typeof itemSchema>;

/** Converte os campos do formulário nas colunas de data do banco (o banco normaliza o resto). */
export function itemParaBanco(d: ItemForm) {
  const base = {
    titulo: d.titulo,
    descricao: d.descricao,
    frente_id: d.frente_id,
    regiao: d.regiao,
    local: d.local,
    status: d.status,
    data_precisao: d.data_precisao,
    data_texto: d.data_texto,
    data_inicio: null as string | null,
    data_fim: null as string | null,
    data_hora: null as string | null,
    data_periodo: null as (typeof PERIODOS)[number] | null,
  };
  switch (d.data_precisao) {
    case "exata":
      return {
        ...base,
        data_inicio: d.data_dia!,
        data_fim: d.data_dia!,
        data_hora: d.data_hora || null,
      };
    case "intervalo":
      return { ...base, data_inicio: d.data_inicio!, data_fim: d.data_fim! };
    case "mes":
      return { ...base, data_inicio: `${d.data_mes}-01`, data_fim: `${d.data_mes}-01` };
    case "periodo":
      return {
        ...base,
        data_inicio: `${d.data_ano}-01-01`,
        data_fim: `${d.data_ano}-01-01`,
        data_periodo: d.data_periodo as (typeof PERIODOS)[number],
      };
    default:
      return base;
  }
}
