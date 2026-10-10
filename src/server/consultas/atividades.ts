import "server-only";
import { subDays } from "date-fns";
import { TZDate } from "@date-fns/tz";
import { criarClienteServidor } from "@/lib/supabase/server";
import { FUSO } from "@/lib/datas";
import { TIPOS_ACAO, type FiltrosAtividade } from "@/lib/atividade/filtros";
import type { Database } from "@/lib/supabase/database.types";
import type { PessoaResumo } from "@/server/consultas/itens";

export type AtividadeFeed = Database["public"]["Tables"]["atividades"]["Row"] & {
  ator: Pick<PessoaResumo, "nome" | "iniciais" | "regiao" | "ativo"> | null;
};

export const POR_PAGINA = 40;

/** Início do período no fuso de São Paulo. */
function desde(periodo: FiltrosAtividade["periodo"]): string | null {
  if (!periodo) return null;
  const agora = TZDate.tz(FUSO);
  const inicioHoje = new TZDate(agora.getFullYear(), agora.getMonth(), agora.getDate(), FUSO);
  const dias = { hoje: 0, "7d": 6, "30d": 29 }[periodo];
  return subDays(inicioHoje, dias).toISOString();
}

/**
 * Feed da aba Atividade, do mais recente para o mais antigo. `antesDe` (id) pagina:
 * ids crescem com o tempo, então "id < antesDe" traz a página seguinte.
 */
export async function listarAtividades(
  filtros: FiltrosAtividade,
  antesDe?: number,
): Promise<{ atividades: AtividadeFeed[]; temMais: boolean }> {
  const supabase = await criarClienteServidor();
  let consulta = supabase
    .from("atividades")
    .select("*, ator:perfis ( nome, iniciais, regiao, ativo )")
    .order("id", { ascending: false })
    .limit(POR_PAGINA + 1);

  if (filtros.pessoa) consulta = consulta.eq("ator_id", filtros.pessoa);
  if (filtros.frente) consulta = consulta.eq("frente_id", filtros.frente);
  if (filtros.tipo) consulta = consulta.in("acao", TIPOS_ACAO[filtros.tipo].acoes);
  const inicio = desde(filtros.periodo);
  if (inicio) consulta = consulta.gte("created_at", inicio);
  if (antesDe) consulta = consulta.lt("id", antesDe);

  const { data, error } = await consulta;
  if (error) throw new Error(error.message);
  return { atividades: data.slice(0, POR_PAGINA), temMais: data.length > POR_PAGINA };
}

/** Pessoas para o filtro (inclui inativas: o histórico continua delas). */
export async function listarPessoasDoHistorico() {
  const supabase = await criarClienteServidor();
  const { data } = await supabase.from("perfis").select("id, nome").order("nome");
  return data ?? [];
}
