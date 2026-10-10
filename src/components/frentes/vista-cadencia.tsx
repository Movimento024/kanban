"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { addDays, format, isSameDay, startOfWeek } from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EstadoVazio } from "@/components/comum/estado-vazio";
import { filtrarPorRegiao, useFiltroRegiao } from "@/components/filtro-regiao/use-filtro-regiao";
import { AvisoFiltroRegiao } from "@/components/filtro-regiao/seletor-regiao";
import { CardCadencia, proximaDoItem } from "@/components/frentes/card-cadencia";
import { BotaoNovoItem } from "@/components/itens/botao-novo-item";
import { useItens } from "@/components/itens/provedor-itens";
import { COR_STATUS, ROTULO_REGIAO_ITEM } from "@/lib/constantes";
import { hoje } from "@/lib/datas";
import { DIAS_SEMANA, ocorrenciasEntre } from "@/lib/recorrencia";
import { cn } from "@/lib/utils";
import type { Frente } from "@/server/consultas/frentes";
import type { ItemResumo } from "@/server/consultas/itens";

type Vista = "cards" | "semana";

/** Layout Cadência: grade de cards ou a faixa da Semana (segunda a domingo). */
export function VistaCadencia({ frente, itens: todos }: { frente: Frente; itens: ItemResumo[] }) {
  const [filtro] = useFiltroRegiao();
  const itens = useMemo(() => filtrarPorRegiao(todos, filtro), [todos, filtro]);
  const caminho = usePathname();
  const params = useSearchParams();
  const vista: Vista = params.get("vista") === "semana" ? "semana" : "cards";
  const base = useMemo(() => hoje(), []);

  const link = (v: Vista) => {
    const p = new URLSearchParams(params);
    if (v === "cards") p.delete("vista");
    else p.set("vista", v);
    const qs = p.toString();
    return qs ? `${caminho}?${qs}` : caminho;
  };

  const botao = (v: Vista, rotulo: string, Icone: typeof LayoutGrid) => (
    <Link
      href={link(v)}
      replace
      scroll={false}
      aria-current={vista === v ? "true" : undefined}
      className={cn(
        "text-muted-foreground hover:text-foreground flex h-8 items-center gap-1.5 rounded px-2.5 text-sm font-medium transition-colors",
        vista === v && "bg-background text-foreground shadow-sm",
      )}
    >
      <Icone className="size-4" aria-hidden />
      {rotulo}
    </Link>
  );

  // Recorrentes primeiro, pela próxima data; depois os sem recorrência, na ordem manual.
  const ordenados = useMemo(() => {
    const comData = itens.map((item) => ({ item, proxima: proximaDoItem(item, base) }));
    return [
      ...comData
        .filter((x) => x.proxima)
        .sort((a, b) => a.proxima!.getTime() - b.proxima!.getTime()),
      ...comData.filter((x) => !x.proxima),
    ].map((x) => x.item);
  }, [itens, base]);

  const recorrentes = itens.filter((i) => i.recorrencia !== "nenhuma").length;

  return (
    <section
      className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3"
      aria-label={`Itens de ${frente.nome}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <nav aria-label="Visualização" className="bg-muted flex gap-1 rounded-md p-1">
          {botao("cards", "Cards", LayoutGrid)}
          {botao("semana", "Semana", CalendarDays)}
        </nav>
        <p className="text-muted-foreground text-sm">
          {itens.length} {itens.length === 1 ? "item" : "itens"}
          {` · ${recorrentes} ${recorrentes === 1 ? "recorrente" : "recorrentes"}`}
        </p>
      </div>

      <AvisoFiltroRegiao ocultos={todos.length - itens.length} />
      {itens.length === 0 ? (
        <EstadoVazio
          titulo={
            filtro === "todos"
              ? `Nenhum conteúdo em ${frente.nome} ainda`
              : `Nenhum conteúdo de ${frente.nome} em ${ROTULO_REGIAO_ITEM[filtro]} ainda`
          }
          descricao="Crie o primeiro e defina a recorrência (ex.: toda terça) para ver a próxima data."
        >
          <BotaoNovoItem frenteId={frente.id} regiao={filtro === "todos" ? undefined : filtro} />
        </EstadoVazio>
      ) : vista === "cards" ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {ordenados.map((item) => (
            <CardCadencia key={item.id} item={item} base={base} />
          ))}
        </div>
      ) : (
        <Semana itens={itens} base={base} />
      )}
    </section>
  );
}

function Semana({ itens, base }: { itens: ItemResumo[]; base: Date }) {
  const { abrirItem } = useItens();
  const [deslocamento, setDeslocamento] = useState(0);
  const segunda = addDays(startOfWeek(base, { weekStartsOn: 1 }), deslocamento * 7);
  const dias = Array.from({ length: 7 }, (_, i) => addDays(segunda, i));
  const domingo = dias[6];

  const porDia = dias.map((dia) =>
    itens.filter(
      (item) =>
        item.status !== "cancelado" &&
        ocorrenciasEntre(item, segunda, domingo).some((d) => isSameDay(d, dia)),
    ),
  );
  const semDia = itens.filter((i) => i.recorrencia === "nenhuma");
  const titulo =
    deslocamento === 0
      ? "Esta semana"
      : deslocamento === 1
        ? "Próxima semana"
        : deslocamento === -1
          ? "Semana passada"
          : `Semana de ${format(segunda, "dd/MM")}`;

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="font-medium">{titulo}</h2>
          <p className="text-muted-foreground text-xs">
            {format(segunda, "dd/MM")} a {format(domingo, "dd/MM/yyyy")}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {deslocamento !== 0 && (
            <Button variant="ghost" size="sm" onClick={() => setDeslocamento(0)}>
              Hoje
            </Button>
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setDeslocamento((d) => d - 1)}
            aria-label="Semana anterior"
          >
            <ChevronLeft aria-hidden />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setDeslocamento((d) => d + 1)}
            aria-label="Próxima semana"
          >
            <ChevronRight aria-hidden />
          </Button>
        </div>
      </div>

      {/* Celular: dias empilhados. Telas maiores: faixa de 7 colunas. */}
      <ol className="grid gap-2 md:grid-cols-7">
        {dias.map((dia, i) => {
          const eHoje = isSameDay(dia, base);
          const doDia = porDia[i];
          return (
            <li
              key={dia.toISOString()}
              aria-label={`${DIAS_SEMANA[dia.getDay()]}, ${format(dia, "dd/MM")}${eHoje ? " (hoje)" : ""}`}
              className={cn(
                "flex min-w-0 gap-2 rounded-xl border p-2 md:min-h-40 md:flex-col",
                eHoje && "border-sky-500/60 bg-sky-500/5",
                dia < base && "opacity-60",
                !doDia.length && "max-md:py-1.5",
              )}
            >
              <div className="flex w-14 shrink-0 flex-col md:w-auto md:flex-row md:items-baseline md:justify-between">
                <span
                  className={cn(
                    "text-muted-foreground text-xs font-medium uppercase",
                    eHoje && "text-sky-700 dark:text-sky-300",
                  )}
                >
                  {DIAS_SEMANA[dia.getDay()].slice(0, 3)}
                </span>
                <span
                  className={cn("text-sm font-semibold", eHoje && "text-sky-700 dark:text-sky-300")}
                >
                  {format(dia, "dd/MM")}
                </span>
              </div>
              <div className="grid min-w-0 flex-1 content-start gap-1.5">
                {doDia.length === 0 ? (
                  <span className="text-muted-foreground/70 self-center text-xs md:pt-1">—</span>
                ) : (
                  doDia.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => abrirItem(item.id)}
                      className="bg-card focus-visible:ring-ring relative min-w-0 overflow-hidden rounded-md border py-1.5 pr-2 pl-3 text-left text-xs shadow-xs hover:shadow-md focus-visible:ring-2 focus-visible:outline-none"
                    >
                      <span
                        className={cn(
                          "absolute inset-y-0 left-0 w-1",
                          COR_STATUS[item.status].ponto,
                        )}
                        aria-hidden
                      />
                      <span className="block truncate font-medium">{item.titulo}</span>
                      {item.canais.length > 0 && (
                        <span className="text-muted-foreground block truncate">
                          {item.canais.join(" · ")}
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {semDia.length > 0 && (
        <div className="grid gap-2">
          <h3 className="text-muted-foreground text-sm font-medium">
            Sem dia fixo ({semDia.length})
          </h3>
          <ul className="flex flex-wrap gap-1.5">
            {semDia.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => abrirItem(item.id)}
                  className="hover:bg-muted focus-visible:ring-ring flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs focus-visible:ring-2 focus-visible:outline-none"
                >
                  <span
                    className={cn("size-1.5 rounded-full", COR_STATUS[item.status].ponto)}
                    aria-hidden
                  />
                  {item.titulo}
                  {item.recorrencia_texto && (
                    <span className="text-muted-foreground italic">· {item.recorrencia_texto}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
