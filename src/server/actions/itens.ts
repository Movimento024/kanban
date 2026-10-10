"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { criarClienteServidor } from "@/lib/supabase/server";
import { traduzirErro } from "@/lib/erros";
import { idsSchema } from "@/lib/validacao/frentes";
import { falha, sucesso, type Resultado } from "@/server/resultado";
import { obterPerfilAtual } from "@/server/sessao";

export async function reordenarItens(frenteId: string, ids: string[]): Promise<Resultado> {
  if (!(await obterPerfilAtual())) return falha("Sua sessão expirou. Entre de novo.");
  const frente = z.uuid().safeParse(frenteId);
  const parsed = idsSchema.safeParse(ids);
  if (!frente.success || !parsed.success) return falha("Ordem inválida.");

  const supabase = await criarClienteServidor();
  const { error } = await supabase.rpc("reordenar_itens", {
    p_frente_id: frente.data,
    p_ids: parsed.data,
  });
  if (error) return falha(traduzirErro(error));

  revalidatePath(`/frentes/${frente.data}`);
  return sucesso(undefined);
}
