"use client";

import { cn } from "@/lib/utils";

/** Botões segmentados (grupo de rádio). */
export function Segmentado<V extends string>({
  rotulo,
  opcoes,
  valor,
  aoMudar,
}: {
  rotulo: string;
  opcoes: { valor: V; rotulo: string }[];
  valor: V;
  aoMudar: (v: V) => void;
}) {
  return (
    <div role="radiogroup" aria-label={rotulo} className="bg-muted flex gap-1 rounded-md p-1">
      {opcoes.map((o) => (
        <button
          key={o.valor}
          type="button"
          role="radio"
          aria-checked={valor === o.valor}
          onClick={() => aoMudar(o.valor)}
          className={cn(
            "text-muted-foreground hover:text-foreground focus-visible:ring-ring h-8 rounded px-2.5 text-sm font-medium focus-visible:ring-2 focus-visible:outline-none",
            valor === o.valor && "bg-background text-foreground shadow-sm",
          )}
        >
          {o.rotulo}
        </button>
      ))}
    </div>
  );
}
