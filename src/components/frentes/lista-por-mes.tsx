"use client";

import { useMemo } from "react";
import { CardItem } from "@/components/itens/card-item";
import { formatarDataItem, paraData, rotuloMes } from "@/lib/datas";
import type { ItemResumo } from "@/server/consultas/itens";

type Grupo = { chave: string; rotulo: string; ordem: string; itens: ItemResumo[] };

/**
 * Agrupa por mês. "Sem data" vem primeiro (como a coluna fixa da linha do tempo);
 * itens de período formam o próprio grupo ("1º semestre de 2027"), antes dos meses
 * que começam na mesma data.
 */
function agrupar(itens: ItemResumo[]): Grupo[] {
  const grupos = new Map<string, Grupo>();
  for (const item of itens) {
    let chave: string, rotulo: string, ordem: string;
    if (!item.data_inicio) {
      chave = "sem-data";
      rotulo = "Sem data";
      ordem = "0";
    } else if (item.data_precisao === "periodo") {
      chave = `periodo-${item.data_inicio}-${item.data_periodo}`;
      rotulo = formatarDataItem(item);
      ordem = `1-${item.data_inicio}-0`;
    } else {
      chave = item.data_inicio.slice(0, 7);
      rotulo = rotuloMes(paraData(item.data_inicio));
      ordem = `1-${chave}-01-1`;
    }
    const g = grupos.get(chave) ?? { chave, rotulo, ordem, itens: [] };
    g.itens.push(item);
    grupos.set(chave, g);
  }
  return [...grupos.values()]
    .sort((a, b) => a.ordem.localeCompare(b.ordem))
    .map((g) => ({
      ...g,
      itens: g.itens.sort(
        (a, b) => (a.data_inicio ?? "").localeCompare(b.data_inicio ?? "") || a.ordem - b.ordem,
      ),
    }));
}

export function ListaPorMes({ itens }: { itens: ItemResumo[] }) {
  const grupos = useMemo(() => agrupar(itens), [itens]);
  return (
    <div className="grid gap-5">
      {grupos.map((g) => (
        <section key={g.chave} className="grid gap-2" aria-labelledby={`grupo-${g.chave}`}>
          <h2
            id={`grupo-${g.chave}`}
            className="bg-background/95 sticky top-[6.25rem] z-10 -mx-1 px-1 py-1 text-sm font-semibold backdrop-blur"
          >
            {g.rotulo} <span className="text-muted-foreground font-normal">({g.itens.length})</span>
          </h2>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {g.itens.map((i) => (
              <li key={i.id}>
                <CardItem item={i} className="w-full" />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
