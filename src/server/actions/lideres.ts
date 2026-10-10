"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { criarClienteServidor } from "@/lib/supabase/server";
import { traduzirErro } from "@/lib/erros";
import { falha, sucesso, type Resultado } from "@/server/resultado";
import { obterPerfilAtual } from "@/server/sessao";

const SESSAO_EXPIRADA = "Sua sessão expirou. Entre de novo.";

const atribuicaoSchema = z
  .object({
    itemId: z.guid(),
    pessoaIds: z.array(z.guid()).min(1, "Escolha pelo menos uma pessoa.").max(30),
    papel: z.enum(["responsavel", "apoio"]),
  })
  .refine((d) => d.papel === "apoio" || d.pessoaIds.length === 1, {
    message: "Só uma pessoa pode ser a responsável pelo item.",
  });

/**
 * Atribuição rápida (aba Por líder): coloca uma ou mais pessoas num item.
 * Quem já está no item só muda de papel. Se alguém vira responsável, o
 * responsável anterior passa a apoio (ninguém sai do item).
 */
export async function atribuirPessoas(
  itemId: string,
  pessoaIds: string[],
  papel: "responsavel" | "apoio",
): Promise<Resultado> {
  if (!(await obterPerfilAtual())) return falha(SESSAO_EXPIRADA);
  const v = atribuicaoSchema.safeParse({ itemId, pessoaIds, papel });
  if (!v.success) return falha(v.error.issues[0]?.message ?? "Dados inválidos.");

  const supabase = await criarClienteServidor();
  if (papel === "responsavel") {
    const { error } = await supabase
      .from("atribuicoes")
      .update({ papel: "apoio" })
      .eq("item_id", itemId)
      .eq("papel", "responsavel")
      .neq("pessoa_id", v.data.pessoaIds[0]);
    if (error) return falha(traduzirErro(error));
  }
  const { error } = await supabase.from("atribuicoes").upsert(
    v.data.pessoaIds.map((pessoa_id) => ({ item_id: itemId, pessoa_id, papel })),
    { onConflict: "item_id,pessoa_id" },
  );
  if (error) return falha(traduzirErro(error));

  revalidatePath("/", "layout");
  const n = v.data.pessoaIds.length;
  return sucesso(
    undefined,
    papel === "responsavel"
      ? "Responsável definido."
      : n === 1
        ? "Pessoa adicionada como apoio."
        : `${n} pessoas adicionadas como apoio.`,
  );
}

/** Quem passa deste número de itens como responsável aparece como sobrecarregado (só admin). */
export async function definirLimiteSobrecarga(limite: number): Promise<Resultado> {
  const perfil = await obterPerfilAtual();
  if (!perfil) return falha(SESSAO_EXPIRADA);
  if (perfil.papel !== "admin") return falha("Apenas administradores podem mudar o limite.");
  const v = z.number().int().min(1, "Mínimo 1.").max(50, "Máximo 50.").safeParse(limite);
  if (!v.success) return falha(v.error.issues[0]?.message ?? "Limite inválido.");

  const supabase = await criarClienteServidor();
  const { error, count } = await supabase
    .from("configuracoes")
    .update({ valor: v.data }, { count: "exact" })
    .eq("chave", "limite_sobrecarga");
  if (error) return falha(traduzirErro(error));
  if (!count) return falha("Não foi possível salvar o limite.");

  revalidatePath("/lideres");
  return sucesso(undefined, `Limite atualizado para ${v.data} itens.`);
}
