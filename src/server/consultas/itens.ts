import "server-only";
import { criarClienteServidor } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type Tabelas = Database["public"]["Tables"];
export type PessoaResumo = Pick<
  Tabelas["perfis"]["Row"],
  "id" | "nome" | "iniciais" | "regiao" | "ativo"
>;

export type ItemResumo = Pick<
  Tabelas["itens"]["Row"],
  | "id"
  | "frente_id"
  | "titulo"
  | "descricao"
  | "data_hora"
  | "status"
  | "regiao"
  | "local"
  | "ordem"
  | "data_precisao"
  | "data_inicio"
  | "data_fim"
  | "data_periodo"
  | "data_texto"
  | "recorrencia"
  | "recorrencia_dia_semana"
  | "recorrencia_estreia"
  | "recorrencia_texto"
  | "canais"
> & {
  responsavel: PessoaResumo | null;
  apoio: PessoaResumo[];
  tarefasTotal: number;
  tarefasConcluidas: number;
  decisoesAbertas: number;
};

const CAMPOS = `
  id, frente_id, titulo, descricao, status, regiao, local, ordem, data_hora,
  data_precisao, data_inicio, data_fim, data_periodo, data_texto,
  recorrencia, recorrencia_dia_semana, recorrencia_estreia, recorrencia_texto, canais,
  atribuicoes ( papel, perfis!atribuicoes_pessoa_id_fkey ( id, nome, iniciais, regiao, ativo ) ),
  tarefas ( concluida, archived_at ),
  decisoes ( status, archived_at )
`;

type Linha = {
  atribuicoes: { papel: "responsavel" | "apoio"; perfis: PessoaResumo }[];
  tarefas: { concluida: boolean; archived_at: string | null }[];
  decisoes: { status: "aberta" | "decidida"; archived_at: string | null }[];
};

function resumir<L extends Linha>({ atribuicoes, tarefas, decisoes, ...item }: L) {
  const tarefasAtivas = tarefas.filter((t) => !t.archived_at);
  return {
    ...item,
    responsavel: atribuicoes.find((a) => a.papel === "responsavel")?.perfis ?? null,
    apoio: atribuicoes.filter((a) => a.papel === "apoio").map((a) => a.perfis),
    tarefasTotal: tarefasAtivas.length,
    tarefasConcluidas: tarefasAtivas.filter((t) => t.concluida).length,
    decisoesAbertas: decisoes.filter((d) => !d.archived_at && d.status === "aberta").length,
  };
}

/** Itens ativos de uma frente, com responsável, apoio e contagens. */
export async function listarItensDaFrente(frenteId: string): Promise<ItemResumo[]> {
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase
    .from("itens")
    .select(CAMPOS)
    .eq("frente_id", frenteId)
    .is("archived_at", null)
    .order("ordem")
    .order("created_at");
  if (error) throw new Error(error.message);
  return data.map(resumir);
}

/** Itens ativos de todas as frentes ativas (Visão geral, Por líder). */
export async function listarItensAtivos(): Promise<ItemResumo[]> {
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase
    .from("itens")
    .select(`${CAMPOS}, frente:frentes!inner ( archived_at )`)
    .is("archived_at", null)
    .is("frente.archived_at", null)
    .order("ordem")
    .order("created_at");
  if (error) throw new Error(error.message);
  return data.map(resumir);
}
