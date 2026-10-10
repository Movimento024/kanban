"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconeFrente } from "@/components/frentes/icone-frente";
import { DialogFrente } from "@/components/frentes/dialog-frente";
import { DialogExcluirFrente } from "@/components/frentes/dialog-excluir-frente";
import { ROTULO_LAYOUT } from "@/lib/constantes";
import { corFrente } from "@/lib/frentes";
import { cn } from "@/lib/utils";
import { arquivarFrente } from "@/server/actions/frentes";
import type { Frente } from "@/server/consultas/frentes";

type Aberto = "editar" | "arquivar" | "excluir" | null;

export function CabecalhoFrente({
  frente,
  outrasFrentes,
  totalItens,
  eAdmin,
}: {
  frente: Frente;
  outrasFrentes: Frente[];
  totalItens: number;
  eAdmin: boolean;
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState<Aberto>(null);
  const [pendente, iniciar] = useTransition();
  const fechar = useCallback(() => setAberto(null), []);
  const irParaInicio = useCallback(() => router.push("/"), [router]);
  const cor = corFrente(frente.cor);

  function arquivar() {
    iniciar(async () => {
      const r = await arquivarFrente(frente.id, true);
      if (!r.ok) {
        toast.error(r.erro);
        return;
      }
      toast.success(r.mensagem);
      fechar();
      irParaInicio();
    });
  }

  return (
    <div className="flex flex-wrap items-start gap-3">
      <span
        className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", cor.suave)}
        aria-hidden
      >
        <IconeFrente nome={frente.icone} className="size-6" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{frente.nome}</h1>
          <Badge variant="outline">{ROTULO_LAYOUT[frente.layout]}</Badge>
        </div>
        {frente.descricao && <p className="text-muted-foreground text-sm">{frente.descricao}</p>}
      </div>

      <div className="flex items-center gap-1">
        <Button variant="outline" onClick={() => setAberto("editar")}>
          <Pencil aria-hidden /> Editar
        </Button>
        {/* Arquivar/excluir: só admin (o servidor e o banco também barram). */}
        {eAdmin && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Mais ações da frente">
                <MoreHorizontal aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-48">
              <DropdownMenuItem onSelect={() => setAberto("arquivar")}>
                <Archive aria-hidden /> Arquivar frente
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => setAberto("excluir")}>
                <Trash2 aria-hidden /> Excluir definitivamente
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <DialogFrente aberto={aberto === "editar"} frente={frente} aoFechar={fechar} />

      <AlertDialog open={aberto === "arquivar"} onOpenChange={(o) => !o && fechar()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arquivar “{frente.nome}”?</AlertDialogTitle>
            <AlertDialogDescription>
              A aba e {totalItens === 1 ? "o item" : `os ${totalItens} itens`} dela saem das telas,
              mas continuam guardados. Dá para restaurar em Admin › Frentes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pendente}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={pendente}
              onClick={(e) => {
                e.preventDefault();
                arquivar();
              }}
            >
              Arquivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DialogExcluirFrente
        aberto={aberto === "excluir"}
        frente={frente}
        totalItens={totalItens}
        outrasFrentes={outrasFrentes}
        aoFechar={fechar}
        aoExcluir={irParaInicio}
      />
    </div>
  );
}
