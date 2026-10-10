"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { camposDaNovaData } from "@/lib/calendario";
import { criarClienteServidor } from "@/lib/supabase/server";
import { errosDeCampo, traduzirErro } from "@/lib/erros";
import { idsSchema } from "@/lib/validacao/frentes";
import { itemParaBanco, itemSchema, moverItemSchema, type MoverItem } from "@/lib/validacao/itens";
import { dadosDoForm } from "@/lib/validacao/usuarios";
import { falha, sucesso, type Resultado } from "@/server/resultado";
import { obterPerfilAtual } from "@/server/sessao";

const SESSAO_EXPIRADA = "Sua sessão expirou. Entre de novo.";
const SO_ADMIN = "Apenas administradores podem arquivar ou excluir itens.";

/** Itens aparecem em várias telas (frentes, visão geral, por líder). */
function revalidarItens() {
  revalidatePath("/", "layout");
}

export async function criarItem(
  _: Resultado<{ id: string }> | null,
  form: FormData,
): Promise<Resultado<{ id: string }>> {
  if (!(await obterPerfilAtual())) return falha(SESSAO_EXPIRADA);
  const parsed = itemSchema.safeParse(dadosDoForm(form));
  if (!parsed.success) return falha("Confira os campos.", errosDeCampo(parsed.error));

  const supabase = await criarClienteServidor();
  const { data: ultimo } = await supabase
    .from("itens")
    .select("ordem")
    .eq("frente_id", parsed.data.frente_id)
    .order("ordem", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from("itens")
    .insert({ ...itemParaBanco(parsed.data), ordem: (ultimo?.ordem ?? 0) + 1 })
    .select("id")
    .single();
  if (error) return falha(traduzirErro(error));

  revalidarItens();
  return sucesso({ id: data.id }, `“${parsed.data.titulo}” criado.`);
}

export async function editarItem(
  _: Resultado<{ id: string }> | null,
  form: FormData,
): Promise<Resultado<{ id: string }>> {
  if (!(await obterPerfilAtual())) return falha(SESSAO_EXPIRADA);
  const id = z.guid().safeParse(form.get("id"));
  if (!id.success) return falha("Item inválido.");
  const parsed = itemSchema.safeParse(dadosDoForm(form));
  if (!parsed.success) return falha("Confira os campos.", errosDeCampo(parsed.error));

  const supabase = await criarClienteServidor();
  const { error } = await supabase
    .from("itens")
    .update(itemParaBanco(parsed.data))
    .eq("id", id.data);
  if (error) return falha(traduzirErro(error));

  revalidarItens();
  return sucesso({ id: id.data }, "Item atualizado.");
}

/** Muda só a data/horário de um item (arrastar ou redimensionar no calendário). */
export async function moverItem(dados: MoverItem): Promise<Resultado> {
  if (!(await obterPerfilAtual())) return falha(SESSAO_EXPIRADA);
  const parsed = moverItemSchema.safeParse(dados);
  if (!parsed.success) return falha(parsed.error.issues[0]?.message ?? "Data inválida.");

  const supabase = await criarClienteServidor();
  const { error, count } = await supabase
    .from("itens")
    .update(camposDaNovaData(parsed.data), { count: "exact" })
    .eq("id", parsed.data.id)
    .is("archived_at", null);
  if (error) return falha(traduzirErro(error));
  if (!count) return falha("Item não encontrado. Talvez tenha sido arquivado.");

  revalidarItens();
  return sucesso(undefined);
}

export async function arquivarItem(id: string, arquivar: boolean): Promise<Resultado> {
  const perfil = await obterPerfilAtual();
  if (!perfil) return falha(SESSAO_EXPIRADA);
  if (perfil.papel !== "admin") return falha(SO_ADMIN);
  if (!z.guid().safeParse(id).success) return falha("Item inválido.");

  const supabase = await criarClienteServidor();
  const { error } = await supabase
    .from("itens")
    .update({ archived_at: arquivar ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) return falha(traduzirErro(error));

  revalidarItens();
  return sucesso(undefined, arquivar ? "Item arquivado." : "Item restaurado.");
}

export async function excluirItem(id: string): Promise<Resultado> {
  const perfil = await obterPerfilAtual();
  if (!perfil) return falha(SESSAO_EXPIRADA);
  if (perfil.papel !== "admin") return falha(SO_ADMIN);
  if (!z.guid().safeParse(id).success) return falha("Item inválido.");

  const supabase = await criarClienteServidor();
  const { error, count } = await supabase.from("itens").delete({ count: "exact" }).eq("id", id);
  if (error) return falha(traduzirErro(error));
  if (!count) return falha("Item não encontrado.");

  revalidarItens();
  return sucesso(undefined, "Item excluído definitivamente.");
}

export async function reordenarItens(frenteId: string, ids: string[]): Promise<Resultado> {
  if (!(await obterPerfilAtual())) return falha(SESSAO_EXPIRADA);
  const frente = z.guid().safeParse(frenteId);
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
