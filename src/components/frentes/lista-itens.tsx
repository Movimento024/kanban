"use client";

import { useState, useTransition } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import { ListChecks, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AvatarPessoa } from "@/components/comum/avatar-pessoa";
import {
  BadgeDecisoes,
  BadgeRegiao,
  BadgeSemResponsavel,
  BadgeStatus,
} from "@/components/comum/badges";
import { EstadoVazio } from "@/components/comum/estado-vazio";
import { BotaoNovoItem } from "@/components/itens/botao-novo-item";
import { useItens } from "@/components/itens/provedor-itens";
import { ROTULO_STATUS, STATUS } from "@/lib/constantes";
import { cn } from "@/lib/utils";
import { reordenarItens } from "@/server/actions/itens";
import type { Frente } from "@/server/consultas/frentes";
import type { ItemResumo } from "@/server/consultas/itens";

/** Conteúdo clicável da linha (abre o item). Só elementos inline dentro do botão. */
function ConteudoLinha({ item }: { item: ItemResumo }) {
  const { abrirItem } = useItens();
  return (
    <button
      type="button"
      onClick={() => abrirItem(item.id)}
      className="focus-visible:ring-ring flex min-w-0 flex-1 items-center gap-3 rounded-md text-left focus-visible:ring-2 focus-visible:outline-none"
    >
      <span className="block min-w-0 flex-1">
        <span
          className={cn(
            "block truncate font-medium",
            item.status === "cancelado" && "text-muted-foreground line-through",
          )}
        >
          {item.titulo}
        </span>
        <span className="mt-1 flex flex-wrap items-center gap-1.5">
          <BadgeStatus status={item.status} />
          <BadgeRegiao regiao={item.regiao} />
          {!item.responsavel && <BadgeSemResponsavel />}
          <BadgeDecisoes total={item.decisoesAbertas} />
        </span>
      </span>

      {item.tarefasTotal > 0 && (
        <span
          className="text-muted-foreground flex shrink-0 items-center gap-1 text-xs tabular-nums"
          title="Tarefas concluídas / total"
        >
          <ListChecks className="size-4" aria-hidden />
          {item.tarefasConcluidas}/{item.tarefasTotal}
          <span className="sr-only">tarefas concluídas</span>
        </span>
      )}

      <span className="flex shrink-0 -space-x-1.5">
        {item.responsavel && (
          <AvatarPessoa
            nome={`${item.responsavel.nome} (responsável)`}
            iniciais={item.responsavel.iniciais}
            regiao={item.responsavel.regiao}
            ativo={item.responsavel.ativo}
            className="ring-background ring-2"
          />
        )}
        {item.apoio.slice(0, 3).map((p) => (
          <AvatarPessoa
            key={p.id}
            nome={`${p.nome} (apoio)`}
            iniciais={p.iniciais}
            regiao={p.regiao}
            ativo={p.ativo}
            tamanho="sm"
            className="ring-background self-end opacity-90 ring-2"
          />
        ))}
      </span>
    </button>
  );
}

const classeLinha = "flex items-center gap-3 rounded-xl border bg-card px-3 py-2.5";

function LinhaArrastavel({ item }: { item: ItemResumo }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(classeLinha, isDragging && "relative z-10 shadow-lg")}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        className="text-muted-foreground hover:bg-muted focus-visible:ring-ring -ml-1 flex size-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-md focus-visible:ring-2 focus-visible:outline-none active:cursor-grabbing"
        aria-label={`Reordenar ${item.titulo}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" aria-hidden />
      </button>
      <ConteudoLinha item={item} />
    </li>
  );
}

export function ListaItens({ frente, itens }: { frente: Frente; itens: ItemResumo[] }) {
  const [ordem, setOrdem] = useState(itens);
  const [itensProps, setItensProps] = useState(itens);
  const [agrupar, setAgrupar] = useState(false);
  const [, iniciar] = useTransition();

  if (itens !== itensProps) {
    setItensProps(itens);
    setOrdem(itens);
  }

  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function aoSoltar({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const anterior = ordem;
    const nova = arrayMove(
      ordem,
      ordem.findIndex((i) => i.id === active.id),
      ordem.findIndex((i) => i.id === over.id),
    );
    setOrdem(nova);
    iniciar(async () => {
      const r = await reordenarItens(
        frente.id,
        nova.map((i) => i.id),
      );
      if (!r.ok) {
        setOrdem(anterior);
        toast.error(r.erro);
      }
    });
  }

  if (ordem.length === 0) {
    return (
      <EstadoVazio
        titulo={`Nenhum item em ${frente.nome} ainda`}
        descricao="Crie o primeiro item desta frente."
      >
        <BotaoNovoItem frenteId={frente.id} />
      </EstadoVazio>
    );
  }

  const semDono = ordem.filter((i) => !i.responsavel).length;

  return (
    <section className="grid gap-3" aria-label={`Itens de ${frente.nome}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground text-sm">
          {ordem.length} {ordem.length === 1 ? "item" : "itens"}
          {semDono > 0 && ` · ${semDono} sem responsável`}
        </p>
        <div className="flex items-center gap-2">
          <Switch id="agrupar-status" checked={agrupar} onCheckedChange={setAgrupar} />
          <Label htmlFor="agrupar-status" className="font-normal">
            Agrupar por status
          </Label>
        </div>
      </div>

      {agrupar ? (
        <div className="grid gap-5">
          {STATUS.map((s) => {
            const doStatus = ordem.filter((i) => i.status === s);
            if (!doStatus.length) return null;
            return (
              <div key={s} className="grid gap-2">
                <h2 className="text-muted-foreground text-sm font-medium">
                  {ROTULO_STATUS[s]} <span className="tabular-nums">({doStatus.length})</span>
                </h2>
                <ul className="grid gap-2">
                  {doStatus.map((i) => (
                    <li key={i.id} className={classeLinha}>
                      <ConteudoLinha item={i} />
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      ) : (
        <DndContext
          id={`lista-${frente.id}`}
          sensors={sensores}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={aoSoltar}
        >
          <SortableContext items={ordem.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <ul className="grid gap-2">
              {ordem.map((i) => (
                <LinhaArrastavel key={i.id} item={i} />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </section>
  );
}
