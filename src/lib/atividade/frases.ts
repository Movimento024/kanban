/**
 * Frases em português para o histórico (tabela `atividades`), ex.:
 * "Caio Santos alterou a data de Mov Day Petrolina de 15/11/2026 para 22/11/2026".
 */
import { formatDistanceToNowStrict, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ROTULO_REGIAO_ITEM,
  ROTULO_STATUS,
  type RegiaoItem,
  type StatusItem,
} from "@/lib/constantes";
import { formatarDataItem, type DataItem } from "@/lib/datas";
import type { Json } from "@/lib/supabase/database.types";

export type AtividadeBase = {
  acao: string;
  entidade: string;
  ator_id: string | null;
  valor_anterior: Json | null;
  valor_novo: Json | null;
  contexto: Json;
  created_at: string;
  ator?: { nome: string } | null;
};

type Obj = Record<string, unknown>;
const obj = (j: Json | null): Obj =>
  j && typeof j === "object" && !Array.isArray(j) ? (j as Obj) : {};
const aspas = (s: unknown) => (s ? `“${s}”` : "");
const CAMPOS_DATA = [
  "data_precisao",
  "data_inicio",
  "data_fim",
  "data_hora",
  "data_hora_fim",
  "data_periodo",
];

/**
 * @param itemAtual estado atual do item (se disponível) para completar a data
 *   antiga/nova quando só parte dos campos de data mudou.
 */
export function fraseAtividade(a: AtividadeBase, itemAtual?: Partial<DataItem>): string {
  const ator = a.ator?.nome ?? (a.ator_id ? "Alguém" : "O sistema");
  const ctx = obj(a.contexto);
  const item = aspas(ctx.item);
  const antes = obj(a.valor_anterior);
  const depois = obj(a.valor_novo);

  switch (a.entidade) {
    case "item":
      switch (a.acao) {
        case "criou":
          return `${ator} criou o item ${item}`;
        case "excluiu":
          return `${ator} excluiu o item ${item}`;
        case "arquivou":
          return `${ator} arquivou o item ${item}`;
        case "restaurou":
          return `${ator} restaurou o item ${item}`;
        case "editou":
          return `${ator} ${descreverEdicaoItem(item, antes, depois, itemAtual)}`;
      }
      break;
    case "frente":
      return `${ator} ${verbo(a.acao)} a frente ${aspas(ctx.frente)}`;
    case "atribuicao": {
      const papel = (depois.papel ?? ctx.papel) === "responsavel" ? "responsável" : "apoio";
      const pessoa = String(ctx.pessoa ?? "alguém");
      const proprio = ctx.pessoa_id && ctx.pessoa_id === a.ator_id;
      if (a.acao === "atribuiu")
        return proprio
          ? `${ator} se atribuiu como ${papel} em ${item}`
          : `${ator} atribuiu ${pessoa} como ${papel} em ${item}`;
      if (a.acao === "desatribuiu")
        return proprio ? `${ator} saiu de ${item}` : `${ator} tirou ${pessoa} de ${item}`;
      return `${ator} mudou ${pessoa} para ${papel} em ${item}`;
    }
    case "tarefa": {
      const t = aspas(ctx.tarefa);
      switch (a.acao) {
        case "criou":
          return `${ator} adicionou a tarefa ${t} em ${item}`;
        case "concluiu":
          return `${ator} concluiu a tarefa ${t}`;
        case "reabriu":
          return `${ator} reabriu a tarefa ${t}`;
        case "editou":
          if ("titulo" in depois)
            return `${ator} renomeou a tarefa ${aspas(antes.titulo)} para ${t}`;
          if ("prazo" in depois)
            return depois.prazo
              ? `${ator} definiu o prazo de ${t} para ${dataCurta(depois.prazo)}`
              : `${ator} tirou o prazo de ${t}`;
          if ("responsavel_id" in depois) return `${ator} mudou quem cuida da tarefa ${t}`;
          return `${ator} editou a tarefa ${t}`;
        default:
          return `${ator} ${verbo(a.acao)} a tarefa ${t}`;
      }
    }
    case "decisao": {
      const d = aspas(ctx.decisao);
      switch (a.acao) {
        case "criou":
          return `${ator} abriu a decisão ${d} em ${item}`;
        case "decidiu":
          return `${ator} decidiu ${d}: ${aspas(ctx.opcao)}`;
        case "reabriu_decisao":
          return `${ator} reabriu a decisão ${d}`;
        case "editou":
          if ("pergunta" in depois)
            return `${ator} mudou a pergunta ${aspas(antes.pergunta)} para ${d}`;
          if ("opcao_escolhida_id" in depois)
            return `${ator} mudou a escolha de ${d} para ${aspas(ctx.opcao)}`;
          return `${ator} editou a decisão ${d}`;
        default:
          return `${ator} ${verbo(a.acao)} a decisão ${d}`;
      }
    }
    case "opcao":
      if (a.acao === "criou")
        return `${ator} adicionou a opção ${aspas(ctx.opcao)} em ${aspas(ctx.decisao)}`;
      if (a.acao === "editou")
        return `${ator} renomeou a opção ${aspas(antes.texto)} para ${aspas(ctx.opcao)}`;
      return `${ator} ${verbo(a.acao)} a opção ${aspas(ctx.opcao)}`;
    case "nota":
      if (a.acao === "criou") return `${ator} comentou em ${item}: ${aspas(resumir(ctx.nota))}`;
      if (a.acao === "editou") return `${ator} editou uma nota em ${item}`;
      return `${ator} ${verbo(a.acao)} uma nota em ${item}`;
  }
  return `${ator} ${verbo(a.acao)} ${item}`.trim();
}

function verbo(acao: string) {
  return (
    (
      {
        criou: "criou",
        editou: "editou",
        excluiu: "excluiu",
        arquivou: "arquivou",
        restaurou: "restaurou",
      } as Record<string, string>
    )[acao] ?? acao
  );
}

function resumir(s: unknown, max = 80) {
  const t = String(s ?? "");
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

function dataCurta(iso: unknown) {
  return typeof iso === "string" ? format(new Date(`${iso}T12:00:00`), "dd/MM/yyyy") : "";
}

/** Predicado da frase de edição, ex.: "alterou a data de “X” de 15/11/2026 para 22/11/2026". */
function descreverEdicaoItem(
  item: string,
  antes: Obj,
  depois: Obj,
  atual?: Partial<DataItem>,
): string {
  const mudou = Object.keys(depois);
  if (mudou.includes("titulo"))
    return `renomeou ${aspas(antes.titulo)} para ${aspas(depois.titulo)}`;

  const partes: string[] = [];
  const mudouData = mudou.some((c) => CAMPOS_DATA.includes(c));
  const de = mudouData ? dataDe({ ...atual, ...antes }) : null;
  const para = mudouData ? dataDe({ ...atual, ...depois }) : null;

  // Só a data mudou: frase do exemplo da visão do produto.
  if (mudouData && mudou.every((c) => CAMPOS_DATA.includes(c)))
    return de && para && de !== para
      ? `alterou a data de ${item} de ${de} para ${para}`
      : `alterou a data de ${item}`;

  if (mudouData)
    partes.push(de && para ? `alterou a data (de ${de} para ${para})` : "alterou a data");
  if (mudou.includes("status"))
    partes.push(
      `mudou o status (de ${ROTULO_STATUS[antes.status as StatusItem]} para ${ROTULO_STATUS[depois.status as StatusItem]})`,
    );
  if (mudou.includes("regiao"))
    partes.push(`mudou a região para ${ROTULO_REGIAO_ITEM[depois.regiao as RegiaoItem]}`);
  if (mudou.includes("local"))
    partes.push(depois.local ? `mudou o local para ${aspas(depois.local)}` : "tirou o local");
  if (mudou.includes("frente_id")) partes.push("mudou a frente");
  if (mudou.includes("descricao")) partes.push("editou a descrição");
  if (mudou.includes("data_texto")) partes.push("editou a observação da data");
  if (mudou.some((c) => c.startsWith("recorrencia") || c === "canais"))
    partes.push("editou a recorrência");

  if (!partes.length) return `editou ${item}`;
  const lista =
    partes.length === 1 ? partes[0] : `${partes.slice(0, -1).join(", ")} e ${partes.at(-1)}`;
  return `${lista} em ${item}`;
}

function dataDe(v: Obj): string | null {
  if (!v.data_precisao) return null;
  return formatarDataItem({
    data_precisao: v.data_precisao as DataItem["data_precisao"],
    data_inicio: (v.data_inicio as string) ?? null,
    data_fim: (v.data_fim as string) ?? null,
    data_hora: (v.data_hora as string) ?? null,
    data_hora_fim: (v.data_hora_fim as string) ?? null,
    data_periodo: (v.data_periodo as DataItem["data_periodo"]) ?? null,
  });
}

/** "há 5 minutos" */
export function haQuanto(iso: string) {
  if (Date.now() - new Date(iso).getTime() < 60_000) return "agora há pouco";
  return `há ${formatDistanceToNowStrict(new Date(iso), { locale: ptBR })}`;
}

/** "10/10/2026 às 14:32" (horário local do navegador; o app é usado em SP). */
export function quando(iso: string) {
  return format(new Date(iso), "dd/MM/yyyy 'às' HH:mm");
}
