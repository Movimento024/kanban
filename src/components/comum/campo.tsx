import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Props = React.ComponentProps<typeof Input> & {
  rotulo: string;
  name: string;
  erro?: string;
  ajuda?: string;
};

/** Label + input + mensagem de erro, com aria ligados. */
export function Campo({ rotulo, name, erro, ajuda, className, id, ...props }: Props) {
  const idCampo = id ?? `campo-${name}`;
  const idDescricao = `${idCampo}-descricao`;
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label htmlFor={idCampo}>{rotulo}</Label>
      <Input
        id={idCampo}
        name={name}
        aria-invalid={erro ? true : undefined}
        aria-describedby={erro || ajuda ? idDescricao : undefined}
        className="h-10 md:h-9"
        {...props}
      />
      {(erro || ajuda) && (
        <p
          id={idDescricao}
          className={cn("text-xs", erro ? "text-destructive" : "text-muted-foreground")}
        >
          {erro ?? ajuda}
        </p>
      )}
    </div>
  );
}
