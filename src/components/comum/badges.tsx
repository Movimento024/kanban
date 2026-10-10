import { cn } from "@/lib/utils";
import {
  COR_REGIAO_ITEM,
  COR_STATUS,
  ROTULO_REGIAO_ITEM,
  ROTULO_STATUS,
  type RegiaoItem,
  type StatusItem,
} from "@/lib/constantes";

const base =
  "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium whitespace-nowrap";

export function BadgeStatus({ status, className }: { status: StatusItem; className?: string }) {
  return (
    <span className={cn(base, COR_STATUS[status].badge, className)}>
      <span className={cn("size-1.5 rounded-full", COR_STATUS[status].ponto)} aria-hidden />
      {ROTULO_STATUS[status]}
    </span>
  );
}

export function BadgeRegiao({ regiao, className }: { regiao: RegiaoItem; className?: string }) {
  return (
    <span className={cn(base, COR_REGIAO_ITEM[regiao], className)}>
      {ROTULO_REGIAO_ITEM[regiao]}
    </span>
  );
}

/** Pendência: item sem responsável. */
export function BadgeSemResponsavel({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        base,
        "border border-dashed border-amber-500/60 text-amber-800 dark:text-amber-300",
        className,
      )}
    >
      Sem responsável
    </span>
  );
}

/** Pendência: decisões abertas, ex.: "2 ?". */
export function BadgeDecisoes({ total, className }: { total: number; className?: string }) {
  if (!total) return null;
  return (
    <span
      className={cn(
        base,
        "bg-amber-500/15 text-amber-800 tabular-nums dark:text-amber-300",
        className,
      )}
      title={`${total} ${total === 1 ? "decisão aberta" : "decisões abertas"}`}
    >
      {total} ?
      <span className="sr-only">{total === 1 ? " decisão aberta" : " decisões abertas"}</span>
    </span>
  );
}
