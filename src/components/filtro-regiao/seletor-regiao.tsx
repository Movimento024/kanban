"use client";

import { MapPin, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFiltroRegiao, type FiltroRegiao } from "@/components/filtro-regiao/use-filtro-regiao";
import { REGIOES_ITEM, ROTULO_REGIAO_ITEM } from "@/lib/constantes";
import { cn } from "@/lib/utils";

export const OPCOES_REGIAO: { valor: FiltroRegiao; rotulo: string }[] = [
  { valor: "todos", rotulo: "Todas as regiões" },
  ...REGIOES_ITEM.map((r) => ({ valor: r, rotulo: ROTULO_REGIAO_ITEM[r] })),
];

/** Filtro de região global, na barra superior. */
export function SeletorRegiao() {
  const [filtro, setFiltro] = useFiltroRegiao();
  return (
    <Select value={filtro} onValueChange={(v) => setFiltro(v as FiltroRegiao)}>
      <SelectTrigger
        aria-label="Filtrar por região"
        size="sm"
        className={cn(
          "gap-1.5 max-sm:px-2",
          filtro !== "todos" && "border-primary/60 text-primary",
        )}
      >
        <MapPin className="size-4" aria-hidden />
        <span className={cn(filtro === "todos" && "max-sm:sr-only")}>
          <SelectValue />
        </span>
      </SelectTrigger>
      <SelectContent align="end">
        {OPCOES_REGIAO.map((o) => (
          <SelectItem key={o.valor} value={o.valor}>
            {o.rotulo}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Aviso de que a tela está filtrada, com atalho para ver tudo. */
export function AvisoFiltroRegiao({ ocultos }: { ocultos: number }) {
  const [filtro, setFiltro] = useFiltroRegiao();
  if (filtro === "todos") return null;
  return (
    <p className="border-primary/30 bg-primary/5 flex flex-wrap items-center gap-2 rounded-lg border px-3 py-1.5 text-sm">
      <MapPin className="text-primary size-4" aria-hidden />
      Mostrando só <strong>{ROTULO_REGIAO_ITEM[filtro]}</strong>
      {ocultos > 0 && (
        <span className="text-muted-foreground">
          ({ocultos} {ocultos === 1 ? "item oculto" : "itens ocultos"})
        </span>
      )}
      <button
        type="button"
        onClick={() => setFiltro("todos")}
        className="text-primary focus-visible:ring-ring ml-auto flex items-center gap-1 rounded font-medium hover:underline focus-visible:ring-2 focus-visible:outline-none"
      >
        <X className="size-3.5" aria-hidden /> Ver todas
      </button>
    </p>
  );
}
