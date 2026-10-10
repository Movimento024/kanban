"use client";

import { useState, useTransition } from "react";
import { ArchiveRestore, Trash2 } from "lucide-react";
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
import { EstadoVazio } from "@/components/comum/estado-vazio";
import { haQuanto, quando } from "@/lib/atividade/frases";
import { arquivarItem, excluirItem } from "@/server/actions/itens";
import { arquivarRamo, excluirRamo } from "@/server/actions/ramos";
import type { Arquivado, TipoArquivado } from "@/server/consultas/arquivados";
import type { Resultado } from "@/server/resultado";

const ROTULO: Record<TipoArquivado, string> = {
  itens: "Item",
  tarefas: "Tarefa",
  decisoes: "Decisão",
  decisao_opcoes: "Opção",
  notas: "Nota",
};

function restaurar(a: Arquivado): Promise<Resultado> {
  return a.tipo === "itens" ? arquivarItem(a.id, false) : arquivarRamo(a.tipo, a.id, false);
}
function excluir(a: Arquivado): Promise<Resultado> {
  return a.tipo === "itens" ? excluirItem(a.id) : excluirRamo(a.tipo, a.id);
}

export function ListaArquivados({ arquivados }: { arquivados: Arquivado[] }) {
  const [pendente, iniciar] = useTransition();
  const [excluindo, setExcluindo] = useState<Arquivado | null>(null);

  const rodar = (fn: () => Promise<Resultado>) =>
    iniciar(async () => {
      const r = await fn();
      if (r.ok) toast.success(r.mensagem);
      else toast.error(r.erro);
    });

  if (!arquivados.length) {
    return (
      <EstadoVazio
        titulo="Nada arquivado"
        descricao="Itens, tarefas, decisões e notas arquivados aparecem aqui para restaurar ou excluir. Frentes arquivadas ficam em Admin › Frentes."
      />
    );
  }

  return (
    <>
      <ul className="grid gap-2">
        {arquivados.map((a) => (
          <li
            key={`${a.tipo}-${a.id}`}
            className="flex flex-wrap items-center gap-3 rounded-xl border p-3"
          >
            <Badge variant="outline">{ROTULO[a.tipo]}</Badge>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{a.titulo}</p>
              <p className="text-muted-foreground truncate text-xs">
                {a.onde} · arquivado{" "}
                <time dateTime={a.arquivadoEm} title={quando(a.arquivadoEm)}>
                  {haQuanto(a.arquivadoEm)}
                </time>
              </p>
            </div>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={pendente}
                onClick={() => rodar(() => restaurar(a))}
              >
                <ArchiveRestore aria-hidden /> Restaurar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive"
                disabled={pendente}
                onClick={() => setExcluindo(a)}
              >
                <Trash2 aria-hidden /> Excluir
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <AlertDialog open={!!excluindo} onOpenChange={(o) => !o && setExcluindo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir “{excluindo?.titulo}” definitivamente?</AlertDialogTitle>
            <AlertDialogDescription>
              Não dá para desfazer. Tudo o que estiver dentro dele também é excluído.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => excluindo && rodar(() => excluir(excluindo))}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
