/** Filtros da aba Atividade (vêm da URL). */
import { z } from "zod";
import type { Database } from "@/lib/supabase/database.types";

type Acao = Database["public"]["Enums"]["acao_atividade"];

export const TIPOS_ACAO = {
  criacao: { rotulo: "Criações", acoes: ["criou"] },
  edicao: { rotulo: "Edições", acoes: ["editou"] },
  atribuicao: { rotulo: "Atribuições", acoes: ["atribuiu", "desatribuiu"] },
  conclusao: { rotulo: "Tarefas concluídas/reabertas", acoes: ["concluiu", "reabriu"] },
  decisao: { rotulo: "Decisões", acoes: ["decidiu", "reabriu_decisao"] },
  arquivamento: { rotulo: "Arquivamentos e restaurações", acoes: ["arquivou", "restaurou"] },
  exclusao: { rotulo: "Exclusões", acoes: ["excluiu"] },
} satisfies Record<string, { rotulo: string; acoes: Acao[] }>;
export type TipoAcao = keyof typeof TIPOS_ACAO;

export const PERIODOS_ATIVIDADE = {
  hoje: "Hoje",
  "7d": "Últimos 7 dias",
  "30d": "Últimos 30 dias",
} as const;
export type PeriodoAtividade = keyof typeof PERIODOS_ATIVIDADE;

const opcional = <T extends z.ZodType>(s: T) => s.optional().catch(undefined);

/** Filtros válidos; valores estranhos na URL são ignorados. */
export const filtrosSchema = z.object({
  pessoa: opcional(z.guid()),
  frente: opcional(z.guid()),
  tipo: opcional(z.enum(Object.keys(TIPOS_ACAO) as [TipoAcao, ...TipoAcao[]])),
  periodo: opcional(
    z.enum(Object.keys(PERIODOS_ATIVIDADE) as [PeriodoAtividade, ...PeriodoAtividade[]]),
  ),
});
export type FiltrosAtividade = z.infer<typeof filtrosSchema>;

/** Lê os filtros de searchParams (valores repetidos: vale o primeiro). */
export function lerFiltros(
  params: Record<string, string | string[] | undefined>,
): FiltrosAtividade {
  const primeiro = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  return filtrosSchema.parse({
    pessoa: primeiro(params.pessoa),
    frente: primeiro(params.frente),
    tipo: primeiro(params.tipo),
    periodo: primeiro(params.periodo),
  });
}
