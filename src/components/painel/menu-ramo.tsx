"use client";

import { useState } from "react";
import { Archive, MoreHorizontal, Trash2 } from "lucide-react";
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
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePainel } from "@/components/painel/contexto-painel";
import { arquivarRamo, excluirRamo } from "@/server/actions/ramos";

type Tabela = "tarefas" | "decisoes" | "decisao_opcoes" | "notas";

/**
 * Menu "⋯" de um ramo: itens próprios (`children`) + Arquivar / Excluir para
 * admin (líder não vê essas opções; o banco também barra).
 */
export function MenuRamo({
  tabela,
  id,
  nome,
  children,
}: {
  tabela: Tabela;
  id: string;
  nome: string;
  children?: React.ReactNode;
}) {
  const { eAdmin, executar } = usePainel();
  const [confirmar, setConfirmar] = useState(false);
  if (!children && !eAdmin) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-xs"
            className="nodrag nopan text-muted-foreground shrink-0"
            aria-label={`Mais ações: ${nome}`}
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-48">
          {children}
          {eAdmin && (
            <>
              {children && <DropdownMenuSeparator />}
              <DropdownMenuItem onSelect={() => executar(() => arquivarRamo(tabela, id, true))}>
                <Archive aria-hidden /> Arquivar
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onSelect={() => setConfirmar(true)}>
                <Trash2 aria-hidden /> Excluir definitivamente
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmar} onOpenChange={setConfirmar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir “{nome}” definitivamente?</AlertDialogTitle>
            <AlertDialogDescription>
              Não dá para desfazer{tabela === "tarefas" ? " (as subtarefas vão junto)" : ""}
              {tabela === "decisoes" ? " (as opções vão junto)" : ""}. Para só tirar da tela, use
              Arquivar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => executar(() => excluirRamo(tabela, id))}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
