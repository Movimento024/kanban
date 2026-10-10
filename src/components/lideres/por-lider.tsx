"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Hand, Users } from "lucide-react";
import { AtribuicaoRapida } from "@/components/lideres/atribuicao-rapida";
import { GradeLideres } from "@/components/lideres/grade-lideres";
import { cargaPorPessoa } from "@/lib/panorama";
import { cn } from "@/lib/utils";
import type { Frente } from "@/server/consultas/frentes";
import type { Panorama } from "@/server/consultas/panorama";

type Modo = "pessoas" | "atribuir";

/** Aba Por líder: grade de pessoas ou atribuição rápida (?modo=atribuir). */
export function PorLider({
  panorama,
  frentes,
  eAdmin,
}: {
  panorama: Panorama;
  frentes: Frente[];
  eAdmin: boolean;
}) {
  const caminho = usePathname();
  const params = useSearchParams();
  const modo: Modo = params.get("modo") === "atribuir" ? "atribuir" : "pessoas";
  const cargas = useMemo(
    () => cargaPorPessoa(panorama.itens, panorama.tarefas),
    [panorama.itens, panorama.tarefas],
  );

  const link = (m: Modo) => {
    const p = new URLSearchParams(params);
    if (m === "pessoas") p.delete("modo");
    else p.set("modo", m);
    const qs = p.toString();
    return qs ? `${caminho}?${qs}` : caminho;
  };

  const botao = (m: Modo, rotulo: string, Icone: typeof Users) => (
    <Link
      href={link(m)}
      replace
      scroll={false}
      aria-current={modo === m ? "true" : undefined}
      className={cn(
        "text-muted-foreground hover:text-foreground flex h-8 items-center gap-1.5 rounded px-2.5 text-sm font-medium transition-colors",
        modo === m && "bg-background text-foreground shadow-sm",
      )}
    >
      <Icone className="size-4" aria-hidden />
      {rotulo}
    </Link>
  );

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-4">
      <nav aria-label="Modo" className="bg-muted flex w-fit gap-1 rounded-md p-1">
        {botao("pessoas", "Pessoas", Users)}
        {botao("atribuir", "Atribuição rápida", Hand)}
      </nav>
      {modo === "pessoas" ? (
        <GradeLideres
          pessoas={panorama.pessoas}
          cargas={cargas}
          limite={panorama.limiteSobrecarga}
          eAdmin={eAdmin}
        />
      ) : (
        <AtribuicaoRapida
          pessoas={panorama.pessoas}
          itens={panorama.itens}
          frentes={frentes}
          cargas={cargas}
        />
      )}
    </div>
  );
}
