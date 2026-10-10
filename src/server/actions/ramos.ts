"use server";

/**
 * Ações do painel do item: pessoas, tarefas, decisões, opções e notas.
 * Chamadas direto dos componentes (não por formulário). Toda entrada é
 * validada com Zod e toda escrita usa o cliente do usuário (RLS + triggers).
 * Arquivar/excluir: o banco já barra não-admins; aqui só antecipamos a mensagem.
 */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { criarClienteServidor } from "@/lib/supabase/server";
import { traduzirErro } from "@/lib/erros";
import { falha, sucesso, type Resultado } from "@/server/resultado";
import { obterDetalheItem, type DetalheItem } from "@/server/consultas/detalhe-item";
import { obterPerfilAtual, type Perfil } from "@/server/sessao";

const id = z.guid();
const texto = (max: number, rotulo: string) =>
  z.string().trim().min(1, `Escreva ${rotulo}.`).max(max, `Texto muito longo (máx. ${max}).`);
const dataOpcional = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida.")
  .nullable();

type Tabela = "tarefas" | "decisoes" | "decisao_opcoes" | "notas";

async function contexto(): Promise<{ perfil: Perfil } | { erro: Resultado<never> }> {
  const perfil = await obterPerfilAtual();
  if (!perfil) return { erro: falha("Sua sessão expirou. Entre de novo.") };
  return { perfil };
}

/** Contagens e avatares aparecem nas listas: revalida as telas. */
function revalidar() {
  revalidatePath("/", "layout");
}

async function executar(
  fn: (
    sb: Awaited<ReturnType<typeof criarClienteServidor>>,
    perfil: Perfil,
  ) => PromiseLike<{
    error: { message?: string; code?: string } | null;
  }>,
  mensagem?: string,
): Promise<Resultado> {
  const ctx = await contexto();
  if ("erro" in ctx) return ctx.erro;
  const supabase = await criarClienteServidor();
  const { error } = await fn(supabase, ctx.perfil);
  if (error) return falha(traduzirErro(error));
  revalidar();
  return sucesso(undefined, mensagem);
}

function invalido(r: z.ZodSafeParseResult<unknown>): Resultado<never> | null {
  return r.success ? null : falha(r.error.issues[0]?.message ?? "Dados inválidos.");
}

// ------------------------------------------------------------------
// Leitura
// ------------------------------------------------------------------

export async function carregarDetalheItem(itemId: string): Promise<Resultado<DetalheItem>> {
  const ctx = await contexto();
  if ("erro" in ctx) return ctx.erro;
  if (!id.safeParse(itemId).success) return falha("Item não encontrado.");
  const detalhe = await obterDetalheItem(itemId);
  if (!detalhe) return falha("Item não encontrado. Ele pode ter sido arquivado ou excluído.");
  return sucesso(detalhe);
}

// ------------------------------------------------------------------
// Pessoas
// ------------------------------------------------------------------

/**
 * Atribui (ou muda o papel de) uma pessoa no item. Como só pode haver um
 * responsável, quem era responsável passa a apoio — ninguém sai do item.
 */
export async function atribuirPessoa(
  itemId: string,
  pessoaId: string,
  papel: "responsavel" | "apoio",
): Promise<Resultado> {
  const v = z
    .object({ itemId: id, pessoaId: id, papel: z.enum(["responsavel", "apoio"]) })
    .safeParse({ itemId, pessoaId, papel });
  if (!v.success) return falha("Dados inválidos.");

  return executar(async (sb) => {
    if (papel === "responsavel") {
      const r = await sb
        .from("atribuicoes")
        .update({ papel: "apoio" })
        .eq("item_id", itemId)
        .eq("papel", "responsavel")
        .neq("pessoa_id", pessoaId);
      if (r.error) return r;
    }
    return sb
      .from("atribuicoes")
      .upsert({ item_id: itemId, pessoa_id: pessoaId, papel }, { onConflict: "item_id,pessoa_id" });
  });
}

/** "Me atribuir": vira responsável se o item não tiver um; senão, apoio. */
export async function meAtribuir(itemId: string): Promise<Resultado> {
  const ctx = await contexto();
  if ("erro" in ctx) return ctx.erro;
  if (!id.safeParse(itemId).success) return falha("Item inválido.");
  const supabase = await criarClienteServidor();
  const { count } = await supabase
    .from("atribuicoes")
    .select("id", { count: "exact", head: true })
    .eq("item_id", itemId)
    .eq("papel", "responsavel");
  const papel = count ? "apoio" : "responsavel";
  const r = await atribuirPessoa(itemId, ctx.perfil.id, papel);
  return r.ok
    ? sucesso(
        undefined,
        papel === "responsavel" ? "Você é o responsável." : "Você entrou como apoio.",
      )
    : r;
}

export async function desatribuirPessoa(itemId: string, pessoaId: string): Promise<Resultado> {
  const e = invalido(z.object({ a: id, b: id }).safeParse({ a: itemId, b: pessoaId }));
  if (e) return e;
  return executar((sb) =>
    sb.from("atribuicoes").delete().eq("item_id", itemId).eq("pessoa_id", pessoaId),
  );
}

// ------------------------------------------------------------------
// Tarefas
// ------------------------------------------------------------------

async function proximaOrdem(
  sb: Awaited<ReturnType<typeof criarClienteServidor>>,
  tabela: Tabela,
  coluna: "item_id" | "decisao_id" | "parent_id",
  valor: string,
) {
  // As tabelas têm colunas diferentes; o cast só simplifica a tipagem da consulta genérica.
  const { data } = await sb
    .from(tabela as "tarefas")
    .select("ordem")
    .eq(coluna as "item_id", valor)
    .order("ordem", { ascending: false })
    .limit(1)
    .maybeSingle();
  return ((data as { ordem: number } | null)?.ordem ?? 0) + 1;
}

export async function criarTarefa(
  itemId: string,
  titulo: string,
  parentId?: string | null,
): Promise<Resultado> {
  const e = invalido(
    z
      .object({ itemId: id, titulo: texto(200, "a tarefa"), parentId: id.nullish() })
      .safeParse({ itemId, titulo, parentId }),
  );
  if (e) return e;
  return executar(async (sb) => {
    const ordem = parentId
      ? await proximaOrdem(sb, "tarefas", "parent_id", parentId)
      : await proximaOrdem(sb, "tarefas", "item_id", itemId);
    return sb
      .from("tarefas")
      .insert({ item_id: itemId, titulo: titulo.trim(), parent_id: parentId ?? null, ordem });
  });
}

const edicaoTarefa = z
  .object({
    titulo: texto(200, "a tarefa"),
    concluida: z.boolean(),
    responsavel_id: id.nullable(),
    prazo: dataOpcional,
  })
  .partial();

export async function editarTarefa(
  tarefaId: string,
  dados: z.infer<typeof edicaoTarefa>,
): Promise<Resultado> {
  const v = edicaoTarefa.safeParse(dados);
  const e = invalido(id.safeParse(tarefaId)) ?? invalido(v);
  if (e) return e;
  return executar((sb) => sb.from("tarefas").update(v.data!).eq("id", tarefaId));
}

// ------------------------------------------------------------------
// Decisões e opções
// ------------------------------------------------------------------

export async function criarDecisao(itemId: string, pergunta: string): Promise<Resultado> {
  const e = invalido(
    z.object({ itemId: id, pergunta: texto(300, "a pergunta") }).safeParse({ itemId, pergunta }),
  );
  if (e) return e;
  return executar(async (sb) =>
    sb.from("decisoes").insert({
      item_id: itemId,
      pergunta: pergunta.trim(),
      ordem: await proximaOrdem(sb, "decisoes", "item_id", itemId),
    }),
  );
}

const edicaoDecisao = z
  .object({
    pergunta: texto(300, "a pergunta"),
    prazo: dataOpcional,
    campo_relacionado: z.enum(["local", "data"]).nullable(),
  })
  .partial();

export async function editarDecisao(
  decisaoId: string,
  dados: z.infer<typeof edicaoDecisao>,
): Promise<Resultado> {
  const v = edicaoDecisao.safeParse(dados);
  const e = invalido(id.safeParse(decisaoId)) ?? invalido(v);
  if (e) return e;
  return executar((sb) => sb.from("decisoes").update(v.data!).eq("id", decisaoId));
}

/** Escolhe uma opção (a decisão fica "decidida") ou reabre (opcaoId = null). */
export async function decidir(decisaoId: string, opcaoId: string | null): Promise<Resultado> {
  const e = invalido(z.object({ d: id, o: id.nullable() }).safeParse({ d: decisaoId, o: opcaoId }));
  if (e) return e;
  return executar(
    (sb) =>
      sb
        .from("decisoes")
        .update(
          opcaoId
            ? { status: "decidida", opcao_escolhida_id: opcaoId }
            : { status: "aberta", opcao_escolhida_id: null },
        )
        .eq("id", decisaoId),
    opcaoId ? "Decisão registrada." : "Decisão reaberta.",
  );
}

export async function criarOpcao(decisaoId: string, textoOpcao: string): Promise<Resultado> {
  const e = invalido(
    z.object({ d: id, t: texto(200, "a opção") }).safeParse({ d: decisaoId, t: textoOpcao }),
  );
  if (e) return e;
  return executar(async (sb) =>
    sb.from("decisao_opcoes").insert({
      decisao_id: decisaoId,
      texto: textoOpcao.trim(),
      ordem: await proximaOrdem(sb, "decisao_opcoes", "decisao_id", decisaoId),
    }),
  );
}

export async function editarOpcao(opcaoId: string, textoOpcao: string): Promise<Resultado> {
  const e = invalido(
    z.object({ o: id, t: texto(200, "a opção") }).safeParse({ o: opcaoId, t: textoOpcao }),
  );
  if (e) return e;
  return executar((sb) =>
    sb.from("decisao_opcoes").update({ texto: textoOpcao.trim() }).eq("id", opcaoId),
  );
}

// ------------------------------------------------------------------
// Notas
// ------------------------------------------------------------------

export async function criarNota(itemId: string, textoNota: string): Promise<Resultado> {
  const e = invalido(
    z.object({ i: id, t: texto(4000, "a nota") }).safeParse({ i: itemId, t: textoNota }),
  );
  if (e) return e;
  return executar((sb) => sb.from("notas").insert({ item_id: itemId, texto: textoNota.trim() }));
}

export async function editarNota(notaId: string, textoNota: string): Promise<Resultado> {
  const e = invalido(
    z.object({ n: id, t: texto(4000, "a nota") }).safeParse({ n: notaId, t: textoNota }),
  );
  if (e) return e;
  return executar((sb) => sb.from("notas").update({ texto: textoNota.trim() }).eq("id", notaId));
}

// ------------------------------------------------------------------
// Item: campo único (ex.: aplicar o local escolhido numa decisão)
// ------------------------------------------------------------------

export async function definirLocalItem(itemId: string, local: string): Promise<Resultado> {
  const e = invalido(
    z.object({ i: id, l: texto(120, "o local") }).safeParse({ i: itemId, l: local }),
  );
  if (e) return e;
  return executar(
    (sb) => sb.from("itens").update({ local: local.trim() }).eq("id", itemId),
    `Local atualizado para “${local.trim()}”.`,
  );
}

// ------------------------------------------------------------------
// Arquivar / restaurar / excluir (só admin)
// ------------------------------------------------------------------

const tabelaSchema = z.enum(["tarefas", "decisoes", "decisao_opcoes", "notas"]);
const NOMES: Record<Tabela, string> = {
  tarefas: "Tarefa",
  decisoes: "Decisão",
  decisao_opcoes: "Opção",
  notas: "Nota",
};

export async function arquivarRamo(
  tabela: Tabela,
  ramoId: string,
  arquivar: boolean,
): Promise<Resultado> {
  const e = invalido(z.object({ t: tabelaSchema, i: id }).safeParse({ t: tabela, i: ramoId }));
  if (e) return e;
  const ctx = await contexto();
  if ("erro" in ctx) return ctx.erro;
  if (ctx.perfil.papel !== "admin") return falha("Apenas administradores podem arquivar.");
  return executar(
    (sb) =>
      sb
        .from(tabela)
        .update({ archived_at: arquivar ? new Date().toISOString() : null })
        .eq("id", ramoId),
    `${NOMES[tabela]} ${arquivar ? "arquivada" : "restaurada"}.`,
  );
}

export async function excluirRamo(tabela: Tabela, ramoId: string): Promise<Resultado> {
  const e = invalido(z.object({ t: tabelaSchema, i: id }).safeParse({ t: tabela, i: ramoId }));
  if (e) return e;
  const ctx = await contexto();
  if ("erro" in ctx) return ctx.erro;
  if (ctx.perfil.papel !== "admin") return falha("Apenas administradores podem excluir.");
  return executar(
    (sb) => sb.from(tabela).delete().eq("id", ramoId),
    `${NOMES[tabela]} excluída definitivamente.`,
  );
}
