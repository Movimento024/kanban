import { z } from "zod";
import { REGIOES_ITEM, STATUS } from "@/lib/constantes";
import { PERIODOS, PRECISOES, paraData } from "@/lib/datas";
import { DIAS_SEMANA, RECORRENCIAS, diaSemanaParaBanco } from "@/lib/recorrencia";

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
    frente_id: z.guid({ error: "Escolha a frente." }),
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
    recorrencia: z.enum(RECORRENCIAS).default("nenhuma"),
    recorrencia_dia_semana: z
      .string()
      .optional()
      .transform((v) => (v ? Number(v) : null))
      .pipe(z.number().int().min(0).max(6).nullable()),
    recorrencia_estreia: z
      .string()
      .optional()
      .transform((v) => v || null),
    recorrencia_texto: textoOpcional(80, "Texto muito longo (máx. 80)."),
    // Canais separados por vírgula: "Instagram,YouTube".
    canais: z
      .string()
      .optional()
      .transform((v) =>
        [
          ...new Set(
            (v ?? "")
              .split(",")
              .map((c) => c.trim())
              .filter(Boolean),
          ),
        ].slice(0, 10),
      )
      .pipe(z.array(z.string().max(30, "Nome de canal muito longo (máx. 30)."))),
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

    const estreia = d.recorrencia_estreia;
    if (estreia && !dataIso.test(estreia)) erro("recorrencia_estreia", "Data de estreia inválida.");
    switch (d.recorrencia) {
      case "semanal":
        if (d.recorrencia_dia_semana == null)
          erro("recorrencia_dia_semana", "Escolha o dia da semana.");
        else if (estreia && dataIso.test(estreia)) {
          const dia = paraData(estreia).getDay();
          if (dia !== d.recorrencia_dia_semana)
            erro(
              "recorrencia_estreia",
              `A estreia precisa cair no dia escolhido (${DIAS_SEMANA[d.recorrencia_dia_semana]}).`,
            );
        }
        break;
      case "quinzenal":
      case "mensal":
        if (!estreia)
          erro("recorrencia_estreia", "Informe a data de estreia (é dela que a conta parte).");
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
    recorrencia: d.recorrencia,
    recorrencia_dia_semana: diaSemanaParaBanco(d),
    recorrencia_estreia: d.recorrencia === "nenhuma" ? null : d.recorrencia_estreia,
    recorrencia_texto: d.recorrencia_texto,
    canais: d.canais,
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
