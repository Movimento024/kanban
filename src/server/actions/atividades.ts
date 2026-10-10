"use server";

import { z } from "zod";
import { filtrosSchema } from "@/lib/atividade/filtros";
import { listarAtividades, type AtividadeFeed } from "@/server/consultas/atividades";
import { falha, sucesso, type Resultado } from "@/server/resultado";
import { obterPerfilAtual } from "@/server/sessao";

/** "Carregar mais" da aba Atividade. */
export async function carregarMaisAtividades(
  filtros: unknown,
  antesDe: number,
): Promise<Resultado<{ atividades: AtividadeFeed[]; temMais: boolean }>> {
  if (!(await obterPerfilAtual())) return falha("Sua sessão expirou. Entre de novo.");
  const f = filtrosSchema.safeParse(filtros);
  const id = z.number().int().positive().safeParse(antesDe);
  if (!f.success || !id.success) return falha("Filtros inválidos.");
  try {
    return sucesso(await listarAtividades(f.data, id.data));
  } catch {
    return falha("Não foi possível carregar o histórico. Tente de novo.");
  }
}
