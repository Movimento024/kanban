import { IconeFrente } from "@/components/frentes/icone-frente";
import { corFrente } from "@/lib/frentes";
import { cn } from "@/lib/utils";
import type { Frente } from "@/server/consultas/frentes";

/** Ícone + nome da frente na cor dela. */
export function ChipFrente({
  frente,
  className,
}: {
  frente: Pick<Frente, "nome" | "cor" | "icone">;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium",
        corFrente(frente.cor).suave,
        className,
      )}
    >
      <IconeFrente nome={frente.icone} className="size-3 shrink-0" />
      <span className="truncate">{frente.nome}</span>
    </span>
  );
}
