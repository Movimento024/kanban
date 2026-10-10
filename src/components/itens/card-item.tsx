"use client";

import { MapPin } from "lucide-react";
import { AvatarPessoa } from "@/components/comum/avatar-pessoa";
import { BadgeDecisoes, BadgeSemResponsavel, BadgeStatus } from "@/components/comum/badges";
import { useItens } from "@/components/itens/provedor-itens";
import { COR_STATUS } from "@/lib/constantes";
import { formatarDataItem } from "@/lib/datas";
import { cn } from "@/lib/utils";
import type { ItemResumo } from "@/server/consultas/itens";

/** Borda conforme a precisão da data (seção 9 da visão). */
export function classePrecisao(item: Pick<ItemResumo, "data_precisao">) {
  switch (item.data_precisao) {
    case "mes":
      return "border-dashed bg-card/85";
    case "periodo":
      return "border-dashed bg-card/55 backdrop-blur-[1px]";
    default:
      return "bg-card";
  }
}

export function Avatares({ item }: { item: ItemResumo }) {
  if (!item.responsavel && !item.apoio.length) return <BadgeSemResponsavel />;
  return (
    <span className="flex items-center -space-x-1.5">
      {item.responsavel && (
        <AvatarPessoa
          nome={`${item.responsavel.nome} (responsável)`}
          iniciais={item.responsavel.iniciais}
          regiao={item.responsavel.regiao}
          ativo={item.responsavel.ativo}
          tamanho="sm"
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
          className="ring-background opacity-85 ring-2"
        />
      ))}
      {item.apoio.length > 3 && (
        <span className="text-muted-foreground pl-2 text-[10px]">+{item.apoio.length - 3}</span>
      )}
      {!item.responsavel && <BadgeSemResponsavel className="ml-2" />}
    </span>
  );
}

/** Card clicável de item: título, data conforme a precisão, local, status, pessoas e decisões abertas. */
export function CardItem({
  item,
  className,
  style,
}: {
  item: ItemResumo;
  className?: string;
  style?: React.CSSProperties;
}) {
  const { abrirItem } = useItens();
  const data = formatarDataItem(item);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        abrirItem(item.id);
      }}
      style={style}
      title={item.data_texto ? `${item.titulo} — ${data} (${item.data_texto})` : item.titulo}
      className={cn(
        "group focus-visible:ring-ring relative flex min-w-0 flex-col gap-1 overflow-hidden rounded-lg border py-1.5 pr-2 pl-3 text-left shadow-xs transition hover:shadow-md focus-visible:ring-2 focus-visible:outline-none",
        classePrecisao(item),
        className,
      )}
    >
      {/* Faixa lateral na cor do status */}
      <span
        className={cn("absolute inset-y-0 left-0 w-1", COR_STATUS[item.status].ponto)}
        aria-hidden
      />
      <span className="flex w-full items-center gap-1.5">
        <span
          className={cn(
            "min-w-0 flex-1 truncate text-sm font-medium",
            item.status === "cancelado" && "text-muted-foreground line-through",
          )}
        >
          {item.titulo}
        </span>
        <BadgeDecisoes total={item.decisoesAbertas} />
      </span>
      <span className="text-muted-foreground flex w-full min-w-0 items-center gap-1 text-xs">
        <span className="shrink-0">{data}</span>
        {item.data_texto && <span className="truncate italic">· {item.data_texto}</span>}
        {item.local && (
          <span className="flex min-w-0 items-center gap-0.5 truncate">
            · <MapPin className="size-3 shrink-0" aria-hidden />
            <span className="truncate">{item.local}</span>
          </span>
        )}
      </span>
      <span className="flex w-full items-center justify-between gap-2">
        <BadgeStatus status={item.status} />
        <Avatares item={item} />
      </span>
    </button>
  );
}
