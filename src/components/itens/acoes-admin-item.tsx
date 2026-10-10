"use client";

import { useState, useTransition } from "react";
import { Archive, MoreHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { arquivarItem, excluirItem } from "@/server/actions/itens";

/**
 * Só para admin: "Arquivar" em destaque (com Desfazer no aviso) e
 * "Excluir definitivamente" num menu secundário, sempre com confirmação.
 */
export function AcoesAdminItem({
  item,
  aoRemover,
}: {
  item: { id: string; titulo: string };
  aoRemover: () => void;
}) {
  const [confirmar, setConfirmar] = useState(false);
  const [pendente, iniciar] = useTransition();

  function arquivar() {
    iniciar(async () => {
      const r = await arquivarItem(item.id, true);
      if (!r.ok) return void toast.error(r.erro);
      aoRemover();
      toast.success(r.mensagem, {
        action: {
          label: "Desfazer",
          onClick: async () => {
            const d = await arquivarItem(item.id, false);
            if (d.ok) toast.success(d.mensagem);
            else toast.error(d.erro);
          },
        },
      });
    });
  }

  function excluir() {
    iniciar(async () => {
      const r = await excluirItem(item.id);
      if (!r.ok) return void toast.error(r.erro);
      setConfirmar(false);
      aoRemover();
      toast.success(r.mensagem);
    });
  }

  return (
    <div className="flex items-center gap-1">
      <Button type="button" variant="outline" onClick={arquivar} disabled={pendente}>
        <Archive aria-hidden /> Arquivar
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Mais ações do item"
            disabled={pendente}
          >
            <MoreHorizontal aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-48">
          <DropdownMenuItem variant="destructive" onSelect={() => setConfirmar(true)}>
            <Trash2 aria-hidden /> Excluir definitivamente
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmar} onOpenChange={setConfirmar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir “{item.titulo}” definitivamente?</AlertDialogTitle>
            <AlertDialogDescription>
              O item, as tarefas, decisões e notas dele somem para sempre. Se quiser só tirar das
              telas, use Arquivar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pendente}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={pendente}
              onClick={(e) => {
                e.preventDefault();
                excluir();
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
