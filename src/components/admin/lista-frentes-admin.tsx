"use client";

import { useCallback, useState, useTransition } from "react";
import Link from "next/link";
import {
  Archive,
  ArchiveRestore,
  ArrowDown,
  ArrowUp,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EstadoVazio } from "@/components/comum/estado-vazio";
import { IconeFrente } from "@/components/frentes/icone-frente";
import { DialogFrente } from "@/components/frentes/dialog-frente";
import { DialogExcluirFrente } from "@/components/frentes/dialog-excluir-frente";
import { ROTULO_LAYOUT } from "@/lib/constantes";
import { corFrente } from "@/lib/frentes";
import { cn } from "@/lib/utils";
import { arquivarFrente, reordenarFrentes } from "@/server/actions/frentes";
import type { Frente } from "@/server/consultas/frentes";

type FrenteAdmin = Frente & { totalItens: number };
type Aberto =
  | { tipo: "nova" }
  | { tipo: "editar"; frente: FrenteAdmin }
  | { tipo: "excluir"; frente: FrenteAdmin }
  | null;

export function ListaFrentesAdmin({ frentes }: { frentes: FrenteAdmin[] }) {
  const [aberto, setAberto] = useState<Aberto>(null);
  const [pendente, iniciar] = useTransition();
  const fechar = useCallback(() => setAberto(null), []);

  const ativas = frentes.filter((f) => !f.archived_at);
  const arquivadas = frentes.filter((f) => f.archived_at);

  function mover(indice: number, delta: number) {
    const nova = [...ativas];
    const [f] = nova.splice(indice, 1);
    nova.splice(indice + delta, 0, f);
    iniciar(async () => {
      const r = await reordenarFrentes(nova.map((x) => x.id));
      if (!r.ok) toast.error(r.erro);
    });
  }

  function alternarArquivo(f: FrenteAdmin) {
    iniciar(async () => {
      const r = await arquivarFrente(f.id, !f.archived_at);
      if (r.ok) toast.success(r.mensagem);
      else toast.error(r.erro);
    });
  }

  const linha = (f: FrenteAdmin, indice: number) => {
    const cor = corFrente(f.cor);
    const arquivada = !!f.archived_at;
    return (
      <li
        key={f.id}
        className={cn("flex items-center gap-3 rounded-xl border p-3", arquivada && "bg-muted/40")}
      >
        {!arquivada && (
          <div className="flex flex-col">
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={`Subir ${f.nome}`}
              disabled={pendente || indice === 0}
              onClick={() => mover(indice, -1)}
            >
              <ArrowUp aria-hidden />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={`Descer ${f.nome}`}
              disabled={pendente || indice === ativas.length - 1}
              onClick={() => mover(indice, 1)}
            >
              <ArrowDown aria-hidden />
            </Button>
          </div>
        )}
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg",
            cor.suave,
            arquivada && "opacity-60",
          )}
          aria-hidden
        >
          <IconeFrente nome={f.icone} className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          {arquivada ? (
            <p className="text-muted-foreground truncate font-medium">{f.nome}</p>
          ) : (
            <Link href={`/frentes/${f.id}`} className="truncate font-medium hover:underline">
              {f.nome}
            </Link>
          )}
          <p className="text-muted-foreground text-xs">
            {ROTULO_LAYOUT[f.layout]} · {f.totalItens} {f.totalItens === 1 ? "item" : "itens"}
          </p>
        </div>
        {arquivada && <Badge variant="outline">Arquivada</Badge>}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={`Ações para ${f.nome}`}>
              <MoreHorizontal aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-48">
            {!arquivada && (
              <DropdownMenuItem onSelect={() => setAberto({ tipo: "editar", frente: f })}>
                <Pencil aria-hidden /> Editar
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onSelect={() => alternarArquivo(f)}>
              {arquivada ? <ArchiveRestore aria-hidden /> : <Archive aria-hidden />}
              {arquivada ? "Restaurar" : "Arquivar"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => setAberto({ tipo: "excluir", frente: f })}
            >
              <Trash2 aria-hidden /> Excluir definitivamente
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </li>
    );
  };

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          A ordem aqui é a ordem das abas. Também dá para arrastar as abas no topo.
        </p>
        <Button onClick={() => setAberto({ tipo: "nova" })}>
          <Plus aria-hidden /> Nova frente
        </Button>
      </div>

      {ativas.length === 0 ? (
        <EstadoVazio titulo="Nenhuma frente ativa" descricao="Crie a primeira frente." />
      ) : (
        <ul className="grid gap-2">{ativas.map(linha)}</ul>
      )}

      {arquivadas.length > 0 && (
        <section className="grid gap-2">
          <h2 className="text-muted-foreground text-sm font-medium">
            Arquivadas ({arquivadas.length})
          </h2>
          <ul className="grid gap-2">{arquivadas.map(linha)}</ul>
        </section>
      )}

      <DialogFrente
        aberto={aberto?.tipo === "nova" || aberto?.tipo === "editar"}
        frente={aberto?.tipo === "editar" ? aberto.frente : undefined}
        aoFechar={fechar}
      />
      {aberto?.tipo === "excluir" && (
        <DialogExcluirFrente
          aberto
          frente={aberto.frente}
          totalItens={aberto.frente.totalItens}
          outrasFrentes={ativas.filter((f) => f.id !== aberto.frente.id)}
          aoFechar={fechar}
        />
      )}
    </div>
  );
}
