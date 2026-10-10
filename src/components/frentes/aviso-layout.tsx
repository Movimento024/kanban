import { Info } from "lucide-react";
import { ROTULO_LAYOUT, type LayoutFrente } from "@/lib/constantes";

const FASE: Partial<Record<LayoutFrente, number>> = { linha_do_tempo: 4, cadencia: 6 };

/** Temporário: avisa que a visualização própria do tipo ainda não foi construída. */
export function AvisoLayoutEmBreve({ layout }: { layout: LayoutFrente }) {
  return (
    <p className="text-muted-foreground flex items-start gap-2 rounded-lg border border-dashed px-3 py-2 text-sm">
      <Info className="mt-0.5 size-4 shrink-0" aria-hidden />A visualização “{ROTULO_LAYOUT[layout]}
      ” chega na Fase {FASE[layout]}. Por enquanto os itens aparecem em lista.
    </p>
  );
}
