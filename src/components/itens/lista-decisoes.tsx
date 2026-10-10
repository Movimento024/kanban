"use client";

import { CircleHelp } from "lucide-react";
import { useItens } from "@/components/itens/provedor-itens";
import { formatarDiaIso } from "@/lib/datas";
import { cn } from "@/lib/utils";
import type { ItemResumo } from "@/server/consultas/itens";
import type { Panorama } from "@/server/consultas/panorama";

/** Decisões abertas, com o item a que pertencem. Abre o painel do item. */
export function ListaDecisoes({
  decisoes,
  itens,
  colunas = 2,
}: {
  decisoes: Panorama["decisoesAbertas"];
  itens: Map<string, ItemResumo>;
  colunas?: 1 | 2;
}) {
  const { abrirItem } = useItens();
  return (
    <ul className={cn("grid gap-1.5", colunas === 2 && "lg:grid-cols-2")}>
      {decisoes.map((d) => (
        <li key={d.id}>
          <button
            type="button"
            onClick={() => abrirItem(d.item_id)}
            className="bg-card focus-visible:ring-ring flex w-full items-start gap-2 rounded-lg border px-3 py-2 text-left text-sm hover:shadow-sm focus-visible:ring-2 focus-visible:outline-none"
          >
            <CircleHelp className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block">{d.pergunta}</span>
              <span className="text-muted-foreground block truncate text-xs">
                {itens.get(d.item_id)?.titulo}
                {d.prazo && ` · decidir até ${formatarDiaIso(d.prazo)}`}
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
