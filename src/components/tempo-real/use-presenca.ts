"use client";

import { useEffect, useState } from "react";
import { criarClienteNavegador } from "@/lib/supabase/client";
import type { RegiaoPessoa } from "@/lib/constantes";

export type PessoaPresente = { id: string; nome: string; iniciais: string; regiao: RegiaoPessoa };

/**
 * Presença no item: quem mais está com o mesmo item aberto agora.
 * Usa o Presence do Supabase Realtime (não grava nada no banco).
 */
export function usePresencaItem(itemId: string | null, eu: PessoaPresente): PessoaPresente[] {
  const [outros, setOutros] = useState<PessoaPresente[]>([]);
  const { id, nome, iniciais, regiao } = eu;

  useEffect(() => {
    if (!itemId) return;
    const supabase = criarClienteNavegador();
    const canal = supabase.channel(`item:${itemId}`, { config: { presence: { key: id } } });

    canal
      .on("presence", { event: "sync" }, () => {
        const estado = canal.presenceState<PessoaPresente>();
        const pessoas = new Map<string, PessoaPresente>();
        for (const [chave, sessoes] of Object.entries(estado)) {
          const p = sessoes[0];
          if (chave !== id && p)
            pessoas.set(chave, { id: chave, nome: p.nome, iniciais: p.iniciais, regiao: p.regiao });
        }
        setOutros([...pessoas.values()]);
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") void canal.track({ nome, iniciais, regiao });
      });

    return () => {
      setOutros([]);
      void supabase.removeChannel(canal);
    };
  }, [itemId, id, nome, iniciais, regiao]);

  return itemId ? outros : [];
}
