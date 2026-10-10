"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { usePainel } from "@/components/painel/contexto-painel";
import { fraseAtividade, haQuanto, quando } from "@/lib/atividade/frases";

const INICIAIS = 8;

/** Rodapé do painel: o que aconteceu neste item, do mais recente para o mais antigo. */
export function HistoricoItem() {
  const { detalhe } = usePainel();
  const [todos, setTodos] = useState(false);
  const lista = todos ? detalhe.atividades : detalhe.atividades.slice(0, INICIAIS);

  if (!detalhe.atividades.length) {
    return <p className="text-muted-foreground text-sm">Nenhuma alteração registrada ainda.</p>;
  }

  return (
    <div className="grid gap-2">
      <ol className="grid gap-1.5">
        {lista.map((a) => (
          <li key={a.id} className="flex gap-2 text-sm">
            <span
              className="bg-muted-foreground/50 mt-2 size-1.5 shrink-0 rounded-full"
              aria-hidden
            />
            <span className="min-w-0 flex-1">
              {fraseAtividade(a, detalhe.item)}{" "}
              <time
                dateTime={a.created_at}
                title={quando(a.created_at)}
                className="text-muted-foreground text-xs"
              >
                · {haQuanto(a.created_at)}
              </time>
            </span>
          </li>
        ))}
      </ol>
      {detalhe.atividades.length > INICIAIS && (
        <Button
          variant="ghost"
          size="sm"
          className="justify-self-start"
          onClick={() => setTodos(!todos)}
        >
          {todos ? "Mostrar menos" : `Ver todas (${detalhe.atividades.length})`}
        </Button>
      )}
    </div>
  );
}
