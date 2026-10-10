"use server";

import { revalidatePath } from "next/cache";
import { criarClienteServidor } from "@/lib/supabase/server";
import { errosDeCampo, traduzirErro } from "@/lib/erros";
import { dadosDoForm } from "@/lib/validacao/usuarios";
import {
  editarFrenteSchema,
  excluirFrenteSchema,
  frenteSchema,
  idsSchema,
} from "@/lib/validacao/frentes";
import { falha, sucesso, type Resultado } from "@/server/resultado";
import { obterPerfilAtual } from "@/server/sessao";

const SESSAO_EXPIRADA = "Sua sessão expirou. Entre de novo.";
const SO_ADMIN = "Apenas administradores podem fazer isso.";

/** As abas ficam no layout: qualquer mudança em frentes revalida tudo. */
function revalidarAbas() {
  revalidatePath("/", "layout");
}

export async function criarFrente(
  _: Resultado<{ id: string }> | null,
  form: FormData,
): Promise<Resultado<{ id: string }>> {
  if (!(await obterPerfilAtual())) return falha(SESSAO_EXPIRADA);
  const parsed = frenteSchema.safeParse(dadosDoForm(form));
  if (!parsed.success) return falha("Confira os campos.", errosDeCampo(parsed.error));

  const supabase = await criarClienteServidor();
  // Nova frente entra no fim das abas.
  const { data: ultima } = await supabase
    .from("frentes")
    .select("ordem")
    .order("ordem", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from("frentes")
    .insert({ ...parsed.data, ordem: (ultima?.ordem ?? 0) + 1 })
    .select("id")
    .single();
  if (error) return falha(traduzirErro(error));

  revalidarAbas();
  return sucesso({ id: data.id }, `Frente “${parsed.data.nome}” criada.`);
}

export async function editarFrente(
  _: Resultado<{ id: string }> | null,
  form: FormData,
): Promise<Resultado<{ id: string }>> {
  if (!(await obterPerfilAtual())) return falha(SESSAO_EXPIRADA);
  const parsed = editarFrenteSchema.safeParse(dadosDoForm(form));
  if (!parsed.success) return falha("Confira os campos.", errosDeCampo(parsed.error));
  const { id, ...dados } = parsed.data;

  const supabase = await criarClienteServidor();
  const { error } = await supabase.from("frentes").update(dados).eq("id", id);
  if (error) return falha(traduzirErro(error));

  revalidarAbas();
  return sucesso({ id }, "Frente atualizada.");
}

export async function reordenarFrentes(ids: string[]): Promise<Resultado> {
  if (!(await obterPerfilAtual())) return falha(SESSAO_EXPIRADA);
  const parsed = idsSchema.safeParse(ids);
  if (!parsed.success) return falha("Ordem inválida.");

  const supabase = await criarClienteServidor();
  const { error } = await supabase.rpc("reordenar_frentes", { p_ids: parsed.data });
  if (error) return falha(traduzirErro(error));

  revalidarAbas();
  return sucesso(undefined);
}

export async function arquivarFrente(id: string, arquivar: boolean): Promise<Resultado> {
  const perfil = await obterPerfilAtual();
  if (!perfil) return falha(SESSAO_EXPIRADA);
  if (perfil.papel !== "admin") return falha(SO_ADMIN);

  const supabase = await criarClienteServidor();
  const { error } = await supabase
    .from("frentes")
    .update({ archived_at: arquivar ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) return falha(traduzirErro(error));

  revalidarAbas();
  return sucesso(
    undefined,
    arquivar ? "Frente arquivada. Os itens dela voltam se você restaurar." : "Frente restaurada.",
  );
}

export async function excluirFrente(_: Resultado | null, form: FormData): Promise<Resultado> {
  const perfil = await obterPerfilAtual();
  if (!perfil) return falha(SESSAO_EXPIRADA);
  if (perfil.papel !== "admin") return falha(SO_ADMIN);

  const parsed = excluirFrenteSchema.safeParse(dadosDoForm(form));
  if (!parsed.success) return falha("Confira os campos.", errosDeCampo(parsed.error));
  const d = parsed.data;

  const supabase = await criarClienteServidor();
  const { data: frente } = await supabase
    .from("frentes")
    .select("nome, itens(count)")
    .eq("id", d.id)
    .maybeSingle();
  if (!frente) return falha("Frente não encontrada.");
  const totalItens = frente.itens[0]?.count ?? 0;

  if (totalItens > 0 && d.modo === "vazia") {
    return falha("Esta frente tem itens. Escolha mover ou excluir os itens junto.");
  }
  if (d.modo === "excluir_itens" && d.confirmacao.trim() !== frente.nome) {
    return falha("O nome digitado não confere.", {
      confirmacao: `Digite exatamente: ${frente.nome}`,
    });
  }

  const { error } = await supabase.rpc("excluir_frente", {
    p_frente_id: d.id,
    p_destino: d.modo === "mover" ? d.destino : undefined,
  });
  if (error) return falha(traduzirErro(error));

  revalidarAbas();
  return sucesso(undefined, `Frente “${frente.nome}” excluída.`);
}
