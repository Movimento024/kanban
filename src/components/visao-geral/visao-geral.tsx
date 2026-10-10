"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlarmClock, CircleHelp, Layers, UserX } from "lucide-react";
import { Segmentado } from "@/components/comum/segmentado";
import { useFiltroRegiao } from "@/components/filtro-regiao/use-filtro-regiao";
import { LinhaDoTempo } from "@/components/frentes/linha-do-tempo";
import { ListaPorMes } from "@/components/frentes/lista-por-mes";
import { LinhaItem } from "@/components/itens/linha-item";
import { ListaDecisoes } from "@/components/itens/lista-decisoes";
import { Button } from "@/components/ui/button";
import {
  COR_STATUS,
  REGIOES_ITEM,
  ROTULO_REGIAO_ITEM,
  ROTULO_STATUS,
  STATUS,
  type RegiaoItem,
} from "@/lib/constantes";
import { hoje } from "@/lib/datas";
import {
  itensNosProximosDias,
  porData,
  semResponsavel,
  tarefaAtrasada,
  type FiltroRegiaoItem,
} from "@/lib/panorama";
import { cn } from "@/lib/utils";
import type { Frente } from "@/server/consultas/frentes";
import type { Panorama } from "@/server/consultas/panorama";

const DIAS_PROXIMOS = 60;
const LIMITE_LISTA = 6;

const FILTROS: { valor: FiltroRegiaoItem; rotulo: string }[] = [
  { valor: "todos", rotulo: "Todos" },
  ...REGIOES_ITEM.map((r) => ({ valor: r, rotulo: ROTULO_REGIAO_ITEM[r] })),
];

function Contador({
  rotulo,
  valor,
  icone: Icone,
  destaque,
}: {
  rotulo: string;
  valor: number;
  icone: typeof Layers;
  destaque?: "ambar" | "vermelho";
}) {
  return (
    <div
      className={cn(
        "bg-card grid gap-1 rounded-xl border p-3 sm:p-4",
        destaque === "ambar" && valor > 0 && "border-amber-500/50 bg-amber-500/5",
        destaque === "vermelho" && valor > 0 && "border-red-500/50 bg-red-500/5",
      )}
    >
      <span className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium sm:text-sm">
        <Icone className="size-4 shrink-0" aria-hidden />
        {rotulo}
      </span>
      <span className="text-2xl font-semibold tabular-nums sm:text-3xl">{valor}</span>
    </div>
  );
}

/** Lista com "ver todos" quando passa do limite. */
function Limitada<T>({
  itens,
  render,
}: {
  itens: T[];
  render: (visiveis: T[]) => React.ReactNode;
}) {
  const [todos, setTodos] = useState(false);
  const visiveis = todos ? itens : itens.slice(0, LIMITE_LISTA);
  return (
    <div className="grid gap-2">
      {render(visiveis)}
      {itens.length > LIMITE_LISTA && (
        <Button variant="ghost" size="sm" className="w-fit" onClick={() => setTodos(!todos)}>
          {todos ? "Mostrar menos" : `Ver todos (${itens.length})`}
        </Button>
      )}
    </div>
  );
}

function Bloco({
  titulo,
  descricao,
  children,
  className,
}: {
  titulo: string;
  descricao?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("grid min-w-0 content-start gap-3", className)}>
      <div>
        <h2 className="text-lg font-semibold">{titulo}</h2>
        {descricao && <p className="text-muted-foreground text-sm">{descricao}</p>}
      </div>
      {children}
    </section>
  );
}

function Vazio({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-muted-foreground rounded-xl border border-dashed p-4 text-sm">{children}</p>
  );
}

export function VisaoGeral({
  panorama,
  frentes,
  primeiroNome,
}: {
  panorama: Panorama;
  frentes: Frente[];
  primeiroNome: string;
}) {
  // Filtro de região global (o mesmo da barra superior).
  const [regiao, mudarRegiao] = useFiltroRegiao();
  const base = useMemo(() => hoje(), []);

  const frentesPorId = useMemo(() => new Map(frentes.map((f) => [f.id, f])), [frentes]);

  const dados = useMemo(() => {
    const itens = panorama.itens.filter((i) => regiao === "todos" || i.regiao === regiao);
    const ids = new Set(itens.map((i) => i.id));
    const porId = new Map(itens.map((i) => [i.id, i]));
    const decisoes = panorama.decisoesAbertas.filter((d) => ids.has(d.item_id));
    const atrasadas = panorama.tarefas.filter((t) => ids.has(t.item_id) && tarefaAtrasada(t, base));
    const semDono = itens.filter(semResponsavel).sort(porData(base));
    const linhaDoTempo = new Set(
      frentes.filter((f) => f.layout === "linha_do_tempo").map((f) => f.id),
    );
    return {
      itens,
      porId,
      decisoes,
      atrasadas,
      semDono,
      proximos: itensNosProximosDias(itens, DIAS_PROXIMOS, base),
      porStatus: STATUS.map((s) => ({
        status: s,
        total: itens.filter((i) => i.status === s).length,
      })),
      consolidados: itens.filter((i) => linhaDoTempo.has(i.frente_id)),
    };
  }, [panorama, regiao, base, frentes]);

  const regioesLinha: readonly RegiaoItem[] = regiao === "todos" ? REGIOES_ITEM : [regiao];

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="grid gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Olá, {primeiroNome}!</h1>
          <p className="text-muted-foreground text-sm">Como está o planejamento.</p>
        </div>
        <Segmentado rotulo="Região" opcoes={FILTROS} valor={regiao} aoMudar={mudarRegiao} />
      </div>

      {/* Contadores */}
      <section aria-label="Contadores" className="grid gap-3">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Contador rotulo="Itens ativos" valor={dados.itens.length} icone={Layers} />
          <Contador
            rotulo="Decisões abertas"
            valor={dados.decisoes.length}
            icone={CircleHelp}
            destaque="ambar"
          />
          <Contador
            rotulo="Sem responsável"
            valor={dados.semDono.length}
            icone={UserX}
            destaque="ambar"
          />
          <Contador
            rotulo="Tarefas atrasadas"
            valor={dados.atrasadas.length}
            icone={AlarmClock}
            destaque="vermelho"
          />
        </div>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm" aria-label="Itens por status">
          {dados.porStatus.map(({ status, total }) => (
            <li key={status} className="flex items-center gap-1.5">
              <span className={cn("size-2 rounded-full", COR_STATUS[status].ponto)} aria-hidden />
              {ROTULO_STATUS[status]}
              <strong className="tabular-nums">{total}</strong>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <Bloco
          titulo={`Próximos ${DIAS_PROXIMOS} dias`}
          descricao="Itens com data neste período, de todas as frentes."
        >
          {dados.proximos.length === 0 ? (
            <Vazio>Nada marcado para os próximos {DIAS_PROXIMOS} dias.</Vazio>
          ) : (
            <Limitada
              itens={dados.proximos}
              render={(v) => (
                <ul className="grid gap-1.5">
                  {v.map((i) => (
                    <li key={i.id}>
                      <LinhaItem item={i} frente={frentesPorId.get(i.frente_id)} />
                    </li>
                  ))}
                </ul>
              )}
            />
          )}
        </Bloco>

        <Bloco titulo="Pendências" descricao="Itens sem dono e decisões em aberto.">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <h3 className="text-sm font-medium">Sem responsável ({dados.semDono.length})</h3>
              {dados.semDono.length === 0 ? (
                <Vazio>Todo item tem um responsável.</Vazio>
              ) : (
                <Limitada
                  itens={dados.semDono}
                  render={(v) => (
                    <ul className="grid gap-1.5">
                      {v.map((i) => (
                        <li key={i.id}>
                          <LinhaItem item={i} frente={frentesPorId.get(i.frente_id)} />
                        </li>
                      ))}
                    </ul>
                  )}
                />
              )}
              {dados.semDono.length > 0 && (
                <Link
                  href="/lideres?modo=atribuir"
                  className="text-primary w-fit text-sm font-medium underline-offset-4 hover:underline"
                >
                  Atribuir pessoas rapidamente →
                </Link>
              )}
            </div>
            <div className="grid gap-2">
              <h3 className="text-sm font-medium">Decisões abertas ({dados.decisoes.length})</h3>
              {dados.decisoes.length === 0 ? (
                <Vazio>Nenhuma decisão em aberto.</Vazio>
              ) : (
                <Limitada
                  itens={dados.decisoes}
                  render={(v) => <ListaDecisoes decisoes={v} itens={dados.porId} colunas={1} />}
                />
              )}
            </div>
          </div>
        </Bloco>
      </div>

      <Bloco
        titulo="Linha do tempo"
        descricao="Todas as frentes de linha do tempo juntas, até 2028."
      >
        {dados.consolidados.length === 0 ? (
          <Vazio>Nenhum item nas frentes de linha do tempo.</Vazio>
        ) : (
          <>
            <div className="hidden min-w-0 md:block">
              <LinhaDoTempo itens={dados.consolidados} regioes={regioesLinha} />
            </div>
            <div className="md:hidden">
              <ListaPorMes itens={dados.consolidados} />
            </div>
          </>
        )}
      </Bloco>
    </div>
  );
}
