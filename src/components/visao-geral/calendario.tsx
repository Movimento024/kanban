"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin, { Draggable } from "@fullcalendar/interaction";
import ptBrLocale from "@fullcalendar/core/locales/pt-br";
import type {
  DateSelectArg,
  DatesSetArg,
  EventClickArg,
  EventContentArg,
  EventDropArg,
  EventInput,
} from "@fullcalendar/core";
import type { EventReceiveArg, EventResizeDoneArg } from "@fullcalendar/interaction";
import { addDays } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Segmentado } from "@/components/comum/segmentado";
import { useItens } from "@/components/itens/provedor-itens";
import { Button } from "@/components/ui/button";
import {
  camposDaNovaData,
  novaDataDoEvento,
  posicaoDoItem,
  type NovaData,
  type PosicaoEvento,
} from "@/lib/calendario";
import type { RegiaoItem } from "@/lib/constantes";
import { formatarDataItem, hhmm, paraIso } from "@/lib/datas";
import { corFrente } from "@/lib/frentes";
import { ocorrenciasEntre } from "@/lib/recorrencia";
import { cn } from "@/lib/utils";
import { moverItem } from "@/server/actions/itens";
import type { Frente } from "@/server/consultas/frentes";
import type { ItemResumo } from "@/server/consultas/itens";

type Visao = "dayGridMonth" | "timeGridWeek" | "timeGridDay" | "listWeek";

const VISOES_TELA: { valor: Visao; rotulo: string }[] = [
  { valor: "dayGridMonth", rotulo: "Mês" },
  { valor: "timeGridWeek", rotulo: "Semana" },
  { valor: "timeGridDay", rotulo: "Dia" },
  { valor: "listWeek", rotulo: "Agenda" },
];
const VISOES_CELULAR: { valor: Visao; rotulo: string }[] = [
  { valor: "listWeek", rotulo: "Agenda" },
  { valor: "timeGridDay", rotulo: "Dia" },
  { valor: "dayGridMonth", rotulo: "Mês" },
];

const CHAVE_VISAO = "m024:calendario-visao";
const CONSULTA_CELULAR = "(max-width: 767px)";

function useCelular() {
  return useSyncExternalStore(
    (avisar) => {
      const m = window.matchMedia(CONSULTA_CELULAR);
      m.addEventListener("change", avisar);
      return () => m.removeEventListener("change", avisar);
    },
    () => window.matchMedia(CONSULTA_CELULAR).matches,
    () => false,
  );
}

function visaoSalva(celular: boolean): Visao {
  const opcoes = celular ? VISOES_CELULAR : VISOES_TELA;
  try {
    const v = window.localStorage.getItem(CHAVE_VISAO);
    if (opcoes.some((o) => o.valor === v)) return v as Visao;
  } catch {
    // Sem localStorage: fica a visão padrão.
  }
  return opcoes[0].valor;
}

type DadosEvento = {
  item: ItemResumo;
  posicao: PosicaoEvento | null;
};

/** Itens que têm data, mas não um dia (mês, período) ou estão a definir. */
function semDia(item: ItemResumo) {
  return item.recorrencia === "nenhuma" && !posicaoDoItem(item);
}

/**
 * Calendário da Visão geral (estilo Google Agenda). Cada evento é um item:
 * arrastar muda a data, puxar a borda muda o término, clicar no vazio cria um
 * item e clicar no evento abre o painel. Itens recorrentes aparecem em cada
 * ocorrência, mas só se editam pelo painel.
 */
export function Calendario({
  itens,
  frentes,
  regiao,
}: {
  itens: ItemResumo[];
  frentes: Frente[];
  regiao: RegiaoItem | "todos";
}) {
  const { abrirItem, novoItem } = useItens();
  const celular = useCelular();
  const calendario = useRef<FullCalendar>(null);
  const listaSemDia = useRef<HTMLUListElement>(null);
  const [visao, setVisao] = useState<Visao>(() => visaoSalva(celular));
  const [titulo, setTitulo] = useState("");
  const [intervalo, setIntervalo] = useState<{ de: Date; ate: Date } | null>(null);
  // Mudanças ainda sem resposta do servidor (mostradas na hora).
  const [pendentes, setPendentes] = useState<Map<string, Partial<ItemResumo>>>(new Map());

  const frentesPorId = useMemo(() => new Map(frentes.map((f) => [f.id, f])), [frentes]);

  const atuais = useMemo(
    () => itens.map((i) => (pendentes.has(i.id) ? { ...i, ...pendentes.get(i.id) } : i)),
    [itens, pendentes],
  );
  const porId = useMemo(() => new Map(atuais.map((i) => [i.id, i])), [atuais]);

  const opcoesVisao = celular ? VISOES_CELULAR : VISOES_TELA;
  // Ao trocar de tela (ex.: girar o celular), uma visão que não existe lá cai na padrão.
  const visaoAtual = opcoesVisao.some((o) => o.valor === visao) ? visao : opcoesVisao[0].valor;

  useEffect(() => {
    const api = calendario.current?.getApi();
    if (api && api.view.type !== visaoAtual) api.changeView(visaoAtual);
  }, [visaoAtual]);

  const eventos = useMemo<EventInput[]>(() => {
    const lista: EventInput[] = [];
    for (const item of atuais) {
      const cor = corFrente(frentesPorId.get(item.frente_id)?.cor ?? "");
      const base = {
        title: item.titulo,
        backgroundColor: "transparent",
        borderColor: "transparent",
        classNames: [cn("m024-evento", item.status === "cancelado" && "m024-cancelado")],
        extendedProps: { idItem: item.id, cor: `${cor.suave} ${cor.borda}`, ponto: cor.ponto },
      };

      if (item.recorrencia !== "nenhuma") {
        if (!intervalo) continue;
        for (const dia of ocorrenciasEntre(item, intervalo.de, intervalo.ate)) {
          const iso = paraIso(dia);
          lista.push({
            ...base,
            id: `${item.id}:${iso}`,
            start: item.data_hora ? `${iso}T${hhmm(item.data_hora)}` : iso,
            allDay: !item.data_hora,
            editable: false,
            extendedProps: { ...base.extendedProps, recorrente: true },
          });
        }
        continue;
      }

      const posicao = posicaoDoItem(item);
      if (!posicao) continue;
      lista.push({
        ...base,
        id: item.id,
        start: posicao.inicio,
        end: posicao.fim,
        allDay: posicao.diaInteiro,
      });
    }
    return lista;
  }, [atuais, frentesPorId, intervalo]);

  const itensSemDia = useMemo(() => atuais.filter(semDia), [atuais]);

  // Itens sem dia podem ser arrastados para dentro do calendário.
  useEffect(() => {
    const el = listaSemDia.current;
    if (!el) return;
    const arrastavel = new Draggable(el, {
      itemSelector: "[data-item-sem-dia]",
      eventData: (e) => ({
        title: e.getAttribute("data-titulo") ?? "",
        create: true,
        allDay: true,
        extendedProps: { idItem: e.getAttribute("data-item-sem-dia") },
      }),
    });
    return () => arrastavel.destroy();
  }, [itensSemDia.length]);

  const mover = useCallback(async (id: string, nova: NovaData) => {
    setPendentes((m) => new Map(m).set(id, camposDaNovaData(nova)));
    const r = await moverItem({ id, ...nova });
    setPendentes((m) => {
      const n = new Map(m);
      n.delete(id);
      return n;
    });
    if (!r.ok) toast.error(r.erro);
  }, []);

  const dadosDe = (idItem: string): DadosEvento | null => {
    const item = porId.get(idItem);
    return item ? { item, posicao: posicaoDoItem(item) } : null;
  };

  function aoSoltar(info: EventDropArg | EventResizeDoneArg, redimensionou: boolean) {
    const dados = dadosDe(info.event.extendedProps.idItem);
    if (!dados || !info.event.start) return info.revert();
    void mover(
      dados.item.id,
      novaDataDoEvento(
        info.event.start,
        info.event.end,
        info.event.allDay,
        dados.posicao,
        redimensionou,
      ),
    );
  }

  function aoReceber(info: EventReceiveArg) {
    const id = info.event.extendedProps.idItem as string;
    const inicio = info.event.start;
    const diaInteiro = info.event.allDay;
    // O evento passa a vir dos itens (já com a data nova); remove a cópia do arraste.
    info.event.remove();
    if (!inicio || !porId.has(id)) return;
    void mover(id, novaDataDoEvento(inicio, null, diaInteiro));
  }

  function aoSelecionar(info: DateSelectArg) {
    info.view.calendar.unselect();
    const nova = novaDataDoEvento(info.start, info.end, info.allDay, null, true);
    const mesmoDia = nova.inicio === nova.fim;
    novoItem({
      regiao: regiao === "todos" ? undefined : regiao,
      data: {
        precisao: mesmoDia ? "exata" : "intervalo",
        dia: mesmoDia ? nova.inicio : "",
        inicio: mesmoDia ? "" : nova.inicio,
        fim: mesmoDia ? "" : nova.fim,
        hora: nova.hora ?? "",
        horaFim: nova.horaFim ?? "",
      },
    });
  }

  function aoClicar(info: EventClickArg) {
    info.jsEvent.preventDefault();
    abrirItem(info.event.extendedProps.idItem);
  }

  function aoMudarDatas(info: DatesSetArg) {
    setTitulo(info.view.title);
    setIntervalo((atual) =>
      atual && +atual.de === +info.start && +atual.ate === +info.end
        ? atual
        : { de: info.start, ate: addDays(info.end, -1) },
    );
  }

  function trocarVisao(v: Visao) {
    setVisao(v);
    try {
      window.localStorage.setItem(CHAVE_VISAO, v);
    } catch {
      // Sem localStorage: só não lembra a escolha.
    }
  }

  const api = () => calendario.current?.getApi();
  const grade = visaoAtual.startsWith("timeGrid");

  return (
    <div className="grid min-w-0 gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={() => api()?.today()}>
            Hoje
          </Button>
          <Button variant="ghost" size="icon" aria-label="Anterior" onClick={() => api()?.prev()}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Próximo" onClick={() => api()?.next()}>
            <ChevronRight className="size-4" />
          </Button>
          <h2 className="ml-1 text-base font-semibold first-letter:uppercase sm:text-lg">
            {titulo}
          </h2>
        </div>
        <Segmentado
          rotulo="Visualização"
          opcoes={opcoesVisao}
          valor={visaoAtual}
          aoMudar={trocarVisao}
        />
      </div>

      <div className="m024-calendario min-w-0">
        <FullCalendar
          ref={calendario}
          plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
          initialView={visaoAtual}
          locale={ptBrLocale}
          headerToolbar={false}
          firstDay={1}
          slotLabelFormat={{ hour: "2-digit", minute: "2-digit" }}
          eventTimeFormat={{ hour: "2-digit", minute: "2-digit" }}
          height={grade ? "75vh" : "auto"}
          events={eventos}
          eventDisplay="block"
          editable
          droppable
          selectable
          selectMirror
          dayMaxEvents={3}
          nowIndicator
          scrollTime="07:00:00"
          slotDuration="00:30:00"
          snapDuration="00:15:00"
          allDayText="Dia todo"
          noEventsText="Nada marcado neste período."
          longPressDelay={400}
          eventDrop={(info) => aoSoltar(info, false)}
          eventResize={(info) => aoSoltar(info, true)}
          eventReceive={aoReceber}
          select={aoSelecionar}
          eventClick={aoClicar}
          datesSet={aoMudarDatas}
          eventContent={conteudoEvento}
        />
      </div>

      {itensSemDia.length > 0 && (
        <section className="grid gap-2" aria-labelledby="sem-dia-titulo">
          <div>
            <h3 id="sem-dia-titulo" className="text-sm font-medium">
              Sem dia definido ({itensSemDia.length})
            </h3>
            <p className="text-muted-foreground text-xs">
              {celular
                ? "Toque para abrir o item e escolher o dia."
                : "Arraste para um dia do calendário para marcar a data, ou clique para abrir."}
            </p>
          </div>
          <ul ref={listaSemDia} className="flex flex-wrap gap-1.5">
            {itensSemDia.map((item) => {
              const cor = corFrente(frentesPorId.get(item.frente_id)?.cor ?? "");
              return (
                <li
                  key={item.id}
                  data-item-sem-dia={item.id}
                  data-titulo={item.titulo}
                  className={cn(
                    "max-w-full cursor-grab rounded-md border-l-[3px] text-xs active:cursor-grabbing",
                    cor.suave,
                    cor.borda,
                  )}
                >
                  <button
                    type="button"
                    onClick={() => abrirItem(item.id)}
                    className="focus-visible:ring-ring flex max-w-full flex-col items-start rounded-md px-2 py-1 text-left focus-visible:ring-2 focus-visible:outline-none"
                  >
                    <span className="max-w-full truncate font-medium">{item.titulo}</span>
                    <span className="opacity-80">{formatarDataItem(item)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

/** Cria um elemento com classes e filhos (texto ou elementos). */
function el(tag: string, classe: string, ...filhos: (Node | string)[]) {
  const e = document.createElement(tag);
  e.className = classe;
  e.append(...filhos);
  return e;
}

/** Ícone de repetição (o mesmo desenho do `Repeat` do lucide). */
function iconeRecorrente(classe: string) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("class", classe);
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", "Recorrente");
  svg.innerHTML =
    '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>';
  return svg;
}

/**
 * Conteúdo de cada evento, montado direto no DOM: componentes React aqui fazem
 * o calendário chamar flushSync durante a renderização (aviso no console).
 */
function conteudoEvento(arg: EventContentArg): { domNodes: Node[] } {
  const { cor, ponto, recorrente } = arg.event.extendedProps as {
    cor: string;
    ponto: string;
    recorrente?: boolean;
  };
  const titulo = arg.event.title;

  if (arg.view.type.startsWith("list")) {
    const filhos: Node[] = [
      el("span", cn("size-2 shrink-0 rounded-full", ponto)),
      el("span", "truncate", titulo),
    ];
    if (recorrente) filhos.push(iconeRecorrente("text-muted-foreground size-3 shrink-0"));
    return { domNodes: [el("span", "flex items-center gap-2", ...filhos)] };
  }

  const filhos: Node[] = [];
  if (arg.timeText && !arg.event.allDay)
    filhos.push(el("span", "shrink-0 tabular-nums opacity-80", arg.timeText));
  filhos.push(el("span", "min-w-0 truncate font-medium", titulo));
  if (recorrente) filhos.push(iconeRecorrente("size-3 shrink-0 opacity-70"));
  const caixa = el(
    "div",
    cn(
      "flex h-full min-w-0 gap-1 overflow-hidden rounded-[inherit] border-l-[3px] px-1.5 py-0.5 text-xs leading-tight",
      arg.view.type.startsWith("timeGrid") && !arg.event.allDay ? "flex-col" : "items-center",
      cor,
    ),
    ...filhos,
  );
  caixa.title = titulo;
  return { domNodes: [caixa] };
}
