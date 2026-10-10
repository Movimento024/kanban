"use client";

import { useEffect, useState } from "react";
import { criarClienteNavegador } from "@/lib/supabase/client";
import type { RegiaoPessoa } from "@/lib/constantes";

export type PessoaPresente = { id: string; nome: string; iniciais: string; regiao: RegiaoPessoa };

/**
 * Presença no item: quem mais está com o mesmo item aberto agora.
 * Usa o Presence do Supabase Realtime (não grava nada no banco) num canal
 * privado: o RLS em `realtime.messages` só deixa entrar quem está logado e ativo.
 */
export function usePresencaItem(itemId: string | null, eu: PessoaPresente): PessoaPresente[] {
  const [outros, setOutros] = useState<PessoaPresente[]>([]);
  const { id, nome, iniciais, regiao } = eu;

  useEffect(() => {
    if (!itemId) return;
    const supabase = criarClienteNavegador();
    let canal: ReturnType<typeof supabase.channel> | undefined;
    let ativo = true;

    // Canal privado: precisa do token do usuário antes de assinar.
    void supabase.auth.getSession().then(({ data }) => {
      if (!ativo) return;
      void supabase.realtime.setAuth(data.session?.access_token ?? null);
      const c = supabase.channel(`item:${itemId}`, {
        config: { private: true, presence: { key: id } },
      });
      canal = c;
      c.on("presence", { event: "sync" }, () => {
        const estado = c.presenceState<PessoaPresente>();
        const pessoas = new Map<string, PessoaPresente>();
        for (const [chave, sessoes] of Object.entries(estado)) {
          const p = sessoes[0];
          if (chave !== id && p)
            pessoas.set(chave, { id: chave, nome: p.nome, iniciais: p.iniciais, regiao: p.regiao });
        }
        setOutros([...pessoas.values()]);
      }).subscribe((status) => {
        if (status === "SUBSCRIBED") void c.track({ nome, iniciais, regiao });
      });
    });

    return () => {
      ativo = false;
      setOutros([]);
      if (canal) void supabase.removeChannel(canal);
    };
  }, [itemId, id, nome, iniciais, regiao]);

  return itemId ? outros : [];
}
