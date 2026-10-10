"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { CalendarRange, List } from "lucide-react";
import { EstadoVazio } from "@/components/comum/estado-vazio";
import { LinhaDoTempo } from "@/components/frentes/linha-do-tempo";
import { ListaPorMes } from "@/components/frentes/lista-por-mes";
import { BotaoNovoItem } from "@/components/itens/botao-novo-item";
import { cn } from "@/lib/utils";
import type { Frente } from "@/server/consultas/frentes";
import type { ItemResumo } from "@/server/consultas/itens";

type Vista = "tempo" | "lista";

/**
 * Alterna Linha do tempo | Lista. Sem escolha explícita (?vista=), o celular vê a
 * lista e telas maiores veem a linha do tempo — resolvido em CSS, sem piscar.
 */
export function VistaLinhaDoTempo({ frente, itens }: { frente: Frente; itens: ItemResumo[] }) {
  const caminho = usePathname();
  const params = useSearchParams();
  const escolhida = params.get("vista") as Vista | null;

  const link = (v: Vista) => {
    const p = new URLSearchParams(params);
    p.set("vista", v);
    return `${caminho}?${p}`;
  };

  // Classe de visibilidade de cada vista: explícita ou responsiva.
  const mostrar = (v: Vista) =>
    escolhida ? (escolhida === v ? "" : "hidden") : v === "tempo" ? "hidden md:block" : "md:hidden";

  const botao = (v: Vista, rotulo: string, Icone: typeof List) => (
    <Link
      href={link(v)}
      replace
      scroll={false}
      aria-current={escolhida === v ? "true" : undefined}
      className={cn(
        "text-muted-foreground hover:text-foreground flex h-8 items-center gap-1.5 rounded px-2.5 text-sm font-medium transition-colors",
        // Ativo: escolhido, ou (sem escolha) o padrão do tamanho de tela.
        escolhida === v && "bg-background text-foreground shadow-sm",
        !escolhida && v === "tempo" && "md:bg-background md:text-foreground md:shadow-sm",
        !escolhida &&
          v === "lista" &&
          "bg-background text-foreground md:text-muted-foreground shadow-sm md:bg-transparent md:shadow-none",
      )}
    >
      <Icone className="size-4" aria-hidden />
      {rotulo}
    </Link>
  );

  const semDono = itens.filter((i) => !i.responsavel).length;
  const semData = itens.filter((i) => !i.data_inicio).length;

  return (
    <section
      className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3"
      aria-label={`Itens de ${frente.nome}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <nav aria-label="Visualização" className="bg-muted flex gap-1 rounded-md p-1">
          {botao("tempo", "Linha do tempo", CalendarRange)}
          {botao("lista", "Lista", List)}
        </nav>
        <p className="text-muted-foreground text-sm">
          {itens.length} {itens.length === 1 ? "item" : "itens"}
          {semData > 0 && ` · ${semData} sem data`}
          {semDono > 0 && ` · ${semDono} sem responsável`}
        </p>
      </div>

      {itens.length === 0 ? (
        <EstadoVazio
          titulo={`Nenhum item em ${frente.nome} ainda`}
          descricao="Crie o primeiro e ele aparece aqui, no ponto certo do tempo."
        >
          <BotaoNovoItem frenteId={frente.id} />
        </EstadoVazio>
      ) : (
        <>
          <div className={cn("min-w-0", mostrar("tempo"))}>
            <LinhaDoTempo frenteId={frente.id} itens={itens} />
            <p className="text-muted-foreground mt-2 text-xs">
              Borda sólida: dia ou intervalo · tracejada: mês · tracejada e transparente: período.
              Clique num espaço vazio da raia para criar um item naquele mês.
            </p>
          </div>
          <div className={mostrar("lista")}>
            <ListaPorMes itens={itens} />
          </div>
        </>
      )}
    </section>
  );
}
