import { cn } from "@/lib/utils";
import { COR_REGIAO_PESSOA, ROTULO_REGIAO_PESSOA, type RegiaoPessoa } from "@/lib/constantes";

type Props = {
  nome: string;
  iniciais: string;
  regiao: RegiaoPessoa;
  ativo?: boolean;
  tamanho?: "sm" | "md" | "lg";
  className?: string;
};

const TAMANHOS = {
  sm: "size-6 text-[10px]",
  md: "size-8 text-xs",
  lg: "size-12 text-base",
};

/** Círculo com iniciais na cor da região. Inativo fica acinzentado. */
export function AvatarPessoa({
  nome,
  iniciais,
  regiao,
  ativo = true,
  tamanho = "md",
  className,
}: Props) {
  return (
    <span
      title={`${nome} · ${ROTULO_REGIAO_PESSOA[regiao]}${ativo ? "" : " · inativo"}`}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold select-none",
        TAMANHOS[tamanho],
        ativo ? COR_REGIAO_PESSOA[regiao] : "bg-muted text-muted-foreground line-through",
        className,
      )}
    >
      <span aria-hidden>{iniciais}</span>
      <span className="sr-only">{nome}</span>
    </span>
  );
}
