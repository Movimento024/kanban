"use client";

import { CalendarCheck, Repeat } from "lucide-react";
import { BadgeDecisoes, BadgeStatus } from "@/components/comum/badges";
import { Avatares } from "@/components/itens/card-item";
import { useItens } from "@/components/itens/provedor-itens";
import { COR_STATUS } from "@/lib/constantes";
import { formatarDiaCurto, formatarDiaIso, hoje, paraData } from "@/lib/datas";
import { descreverCadencia, distanciaEmDias, proximaOcorrencia } from "@/lib/recorrencia";
import { cn } from "@/lib/utils";
import type { ItemResumo } from "@/server/consultas/itens";

const maiuscula = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Próxima ocorrência do item; cancelados não têm. */
export function proximaDoItem(item: ItemResumo, base: Date = hoje()): Date | null {
  return item.status === "cancelado" ? null : proximaOcorrencia(item, base);
}

/** Card de conteúdo recorrente: canais, cadência, estreia, próxima ocorrência, pessoas e status. */
export function CardCadencia({ item, base }: { item: ItemResumo; base: Date }) {
  const { abrirItem } = useItens();
  const cadencia = descreverCadencia(item);
  const proxima = proximaDoItem(item, base);
  const estreia = item.recorrencia_estreia;
  const estreiaFutura = estreia && paraData(estreia) > base;

  return (
    <button
      type="button"
      onClick={() => abrirItem(item.id)}
      className="bg-card focus-visible:ring-ring relative flex min-w-0 flex-col gap-3 overflow-hidden rounded-xl border p-4 pl-5 text-left shadow-xs transition hover:shadow-md focus-visible:ring-2 focus-visible:outline-none"
    >
      <span
        className={cn("absolute inset-y-0 left-0 w-1", COR_STATUS[item.status].ponto)}
        aria-hidden
      />

      <span className="grid gap-1.5">
        <span className="flex items-start gap-2">
          <span
            className={cn(
              "min-w-0 flex-1 font-medium",
              item.status === "cancelado" && "text-muted-foreground line-through",
            )}
          >
            {item.titulo}
          </span>
          <BadgeDecisoes total={item.decisoesAbertas} />
        </span>
        {item.canais.length > 0 && (
          <span className="flex flex-wrap gap-1" aria-label="Canais">
            {item.canais.map((c) => (
              <span
                key={c}
                className="bg-secondary text-secondary-foreground rounded-full px-2 py-0.5 text-[11px] font-medium"
              >
                {c}
              </span>
            ))}
          </span>
        )}
      </span>

      <span className="text-muted-foreground grid gap-1 text-sm">
        <span className="flex items-center gap-1.5">
          <Repeat className="size-3.5 shrink-0" aria-hidden />
          <span className="min-w-0 truncate">
            {cadencia ? (
              <span className="text-foreground">{maiuscula(cadencia)}</span>
            ) : (
              <span className={cn(item.recorrencia_texto && "italic")}>
                {item.recorrencia_texto ? `Cadência ${item.recorrencia_texto}` : "Sem recorrência"}
              </span>
            )}
            {cadencia && item.recorrencia_texto && (
              <span className="italic"> · {item.recorrencia_texto}</span>
            )}
          </span>
        </span>
        {estreia && (
          <span className="text-xs">
            {estreiaFutura ? "Estreia em " : "No ar desde "}
            {formatarDiaIso(estreia)}
          </span>
        )}
      </span>

      {proxima && (
        <span className="flex items-center gap-2 rounded-lg bg-sky-500/10 px-2.5 py-1.5 text-sm text-sky-900 dark:text-sky-200">
          <CalendarCheck className="size-4 shrink-0" aria-hidden />
          <span>
            Próxima: <strong className="font-semibold">{formatarDiaCurto(proxima)}</strong>{" "}
            <span className="opacity-80">({distanciaEmDias(proxima, base)})</span>
          </span>
        </span>
      )}

      <span className="mt-auto flex items-center justify-between gap-2">
        <BadgeStatus status={item.status} />
        <Avatares item={item} />
      </span>
    </button>
  );
}
