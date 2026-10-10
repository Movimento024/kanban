"use client";

import { BadgeDecisoes, BadgeStatus } from "@/components/comum/badges";
import { ChipFrente } from "@/components/frentes/chip-frente";
import { useItens } from "@/components/itens/provedor-itens";
import { formatarDataItem, formatarDiaCurto } from "@/lib/datas";
import { descreverCadencia, proximaOcorrencia } from "@/lib/recorrencia";
import { cn } from "@/lib/utils";
import type { Frente } from "@/server/consultas/frentes";
import type { ItemResumo } from "@/server/consultas/itens";

/** Data conforme a precisão; itens recorrentes sem data mostram a cadência e a próxima. */
function dataDaLinha(item: ItemResumo): string {
  const cadencia = !item.data_inicio && descreverCadencia(item);
  if (!cadencia) return formatarDataItem(item);
  const proxima = item.status === "cancelado" ? null : proximaOcorrencia(item);
  const texto = cadencia.charAt(0).toUpperCase() + cadencia.slice(1);
  return proxima ? `${texto} · próxima ${formatarDiaCurto(proxima)}` : texto;
}

/** Linha compacta de item (listas da Visão geral e do Por líder). Abre o painel do item. */
export function LinhaItem({ item, frente }: { item: ItemResumo; frente?: Frente }) {
  const { abrirItem } = useItens();
  return (
    <button
      type="button"
      onClick={() => abrirItem(item.id)}
      className="bg-card focus-visible:ring-ring flex w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border px-3 py-2 text-left text-sm transition hover:shadow-sm focus-visible:ring-2 focus-visible:outline-none"
    >
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block truncate font-medium",
            item.status === "cancelado" && "text-muted-foreground line-through",
          )}
        >
          {item.titulo}
        </span>
        <span className="text-muted-foreground block truncate text-xs">
          {frente && <ChipFrente frente={frente} className="mr-1.5 py-0" />}
          {dataDaLinha(item)}
          {item.local && ` · ${item.local}`}
          {item.tarefasTotal > 0 && ` · ${item.tarefasConcluidas}/${item.tarefasTotal} tarefas`}
        </span>
      </span>
      <BadgeDecisoes total={item.decisoesAbertas} />
      <BadgeStatus status={item.status} />
    </button>
  );
}
