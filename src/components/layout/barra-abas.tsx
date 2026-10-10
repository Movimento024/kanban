"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import { History, LayoutDashboard, Plus, Shield, Users } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { corFrente } from "@/lib/frentes";
import { IconeFrente } from "@/components/frentes/icone-frente";
import { DialogFrente } from "@/components/frentes/dialog-frente";
import { reordenarFrentes } from "@/server/actions/frentes";
import type { Frente } from "@/server/consultas/frentes";

const classeAba = (ativa: boolean) =>
  cn(
    "relative flex h-11 shrink-0 items-center gap-2 border-b-2 px-3 text-sm font-medium whitespace-nowrap transition-colors outline-none select-none",
    "focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-ring",
    ativa
      ? "border-foreground text-foreground"
      : "border-transparent text-muted-foreground hover:text-foreground",
  );

function AbaFixa({
  href,
  rotulo,
  icone: Icone,
  ativa,
}: {
  href: string;
  rotulo: string;
  icone: React.ComponentType<{ className?: string }>;
  ativa: boolean;
}) {
  return (
    <Link
      href={href}
      className={classeAba(ativa)}
      aria-current={ativa ? "page" : undefined}
      data-aba-ativa={ativa || undefined}
    >
      <Icone className="size-4" aria-hidden />
      {rotulo}
    </Link>
  );
}

function AbaFrente({
  frente,
  ativa,
  acabouDeArrastar,
}: {
  frente: Frente;
  ativa: boolean;
  acabouDeArrastar: () => boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: frente.id,
  });
  const cor = corFrente(frente.cor);

  return (
    <Link
      ref={setNodeRef}
      href={`/frentes/${frente.id}`}
      aria-current={ativa ? "page" : undefined}
      data-aba-ativa={ativa || undefined}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(classeAba(ativa), isDragging && "bg-muted z-10 cursor-grabbing opacity-80")}
      {...attributes}
      // O dnd-kit marca o elemento como role="button"; a aba continua sendo um link.
      role={undefined}
      // Enter navega; espaço inicia o arrastar pelo teclado (dnd-kit).
      {...listeners}
      // Ao soltar um arraste o navegador dispara um clique: não deve navegar.
      onClick={(e) => acabouDeArrastar() && e.preventDefault()}
      aria-roledescription="aba arrastável"
      aria-describedby="dica-arrastar-abas"
    >
      <span className={cn("flex size-5 items-center justify-center rounded", cor.suave)}>
        <IconeFrente nome={frente.icone} className="size-3.5" />
      </span>
      {frente.nome}
    </Link>
  );
}

export function BarraAbas({ frentes, eAdmin }: { frentes: Frente[]; eAdmin: boolean }) {
  const caminho = usePathname();
  const router = useRouter();
  const [ordem, setOrdem] = useState(frentes);
  const [frentesProps, setFrentesProps] = useState(frentes);
  const [novaAberta, setNovaAberta] = useState(false);
  const [, iniciar] = useTransition();
  const trilho = useRef<HTMLDivElement>(null);
  const arrastando = useRef(false);

  // Props novas (criação/renomeação/revalidação) substituem a ordem local.
  if (frentes !== frentesProps) {
    setFrentesProps(frentes);
    setOrdem(frentes);
  }

  const sensores = useSensors(
    // Distância mínima: um clique simples continua navegando.
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    // No toque, segurar para arrastar (deslizar continua rolando as abas).
    useSensor(TouchSensor, { activationConstraint: { delay: 300, tolerance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      // Enter fica para navegar; espaço pega e solta a aba.
      keyboardCodes: { start: ["Space"], cancel: ["Escape"], end: ["Space", "Enter"] },
    }),
  );

  // Mantém a aba ativa visível no celular.
  useEffect(() => {
    trilho.current
      ?.querySelector("[data-aba-ativa]")
      ?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [caminho]);

  function aoSoltar({ active, over }: DragEndEvent) {
    setTimeout(() => (arrastando.current = false), 0);
    if (!over || active.id === over.id) return;
    const de = ordem.findIndex((f) => f.id === active.id);
    const para = ordem.findIndex((f) => f.id === over.id);
    const anterior = ordem;
    const nova = arrayMove(ordem, de, para);
    setOrdem(nova); // otimista
    iniciar(async () => {
      const r = await reordenarFrentes(nova.map((f) => f.id));
      if (!r.ok) {
        setOrdem(anterior);
        toast.error(r.erro);
      }
    });
  }

  return (
    <nav aria-label="Abas" className="border-b">
      <p id="dica-arrastar-abas" className="sr-only">
        Para reordenar, pressione espaço, use as setas e pressione espaço de novo.
      </p>
      <div
        ref={trilho}
        className="mx-auto flex w-full max-w-7xl [scrollbar-width:none] items-stretch overflow-x-auto px-2 [&::-webkit-scrollbar]:hidden"
      >
        <AbaFixa href="/" rotulo="Visão geral" icone={LayoutDashboard} ativa={caminho === "/"} />

        <DndContext
          id="abas-frentes"
          sensors={sensores}
          collisionDetection={closestCenter}
          modifiers={[restrictToHorizontalAxis]}
          onDragStart={() => (arrastando.current = true)}
          onDragCancel={() => (arrastando.current = false)}
          onDragEnd={aoSoltar}
        >
          <SortableContext items={ordem.map((f) => f.id)} strategy={horizontalListSortingStrategy}>
            {ordem.map((f) => (
              <AbaFrente
                key={f.id}
                frente={f}
                ativa={caminho === `/frentes/${f.id}`}
                acabouDeArrastar={() => arrastando.current}
              />
            ))}
          </SortableContext>
        </DndContext>

        <button
          type="button"
          onClick={() => setNovaAberta(true)}
          className={cn(classeAba(false), "text-muted-foreground")}
        >
          <Plus className="size-4" aria-hidden />
          Nova frente
        </button>

        <div className="bg-border mx-1 my-3 w-px shrink-0" aria-hidden />

        <AbaFixa
          href="/lideres"
          rotulo="Por líder"
          icone={Users}
          ativa={caminho.startsWith("/lideres")}
        />
        <AbaFixa
          href="/atividade"
          rotulo="Atividade"
          icone={History}
          ativa={caminho.startsWith("/atividade")}
        />
        {eAdmin && (
          <AbaFixa
            href="/admin"
            rotulo="Admin"
            icone={Shield}
            ativa={caminho.startsWith("/admin")}
          />
        )}
      </div>

      <DialogFrente
        aberto={novaAberta}
        aoFechar={() => setNovaAberta(false)}
        aoSalvar={(id) => router.push(`/frentes/${id}`)}
      />
    </nav>
  );
}
