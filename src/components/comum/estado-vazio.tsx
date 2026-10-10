import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export function EstadoVazio({
  titulo,
  descricao,
  icone: Icone = Inbox,
  children,
  className,
}: {
  titulo: string;
  descricao?: string;
  icone?: React.ComponentType<{ className?: string }>;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-xl border border-dashed px-6 py-12 text-center",
        className,
      )}
    >
      <Icone className="text-muted-foreground size-8" aria-hidden />
      <p className="font-medium">{titulo}</p>
      {descricao && <p className="text-muted-foreground max-w-sm text-sm">{descricao}</p>}
      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}
