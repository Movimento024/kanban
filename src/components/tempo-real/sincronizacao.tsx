"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { criarClienteNavegador } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/database.types";

/** Evento de janela disparado a cada nova linha em `atividades` (detail = a linha). */
export const EVENTO_ATIVIDADE = "m024:atividade";
export type AtividadeTempoReal = Database["public"]["Tables"]["atividades"]["Row"];

/** Espera as mudanças em sequência (ex.: várias atribuições) antes de atualizar a tela. */
const ESPERA_MS = 600;

/**
 * Tempo real: escuta o histórico (toda criação/edição/atribuição gera uma linha
 * em `atividades`) e a ordem de frentes/itens, e atualiza os dados da tela sem
 * recarregar. O RLS vale: só chega o que o usuário pode ler.
 */
export function SincronizacaoTempoReal() {
  const router = useRouter();
  const routerRef = useRef(router);
  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  useEffect(() => {
    const supabase = criarClienteNavegador();
    let espera: ReturnType<typeof setTimeout> | undefined;
    const atualizar = () => {
      clearTimeout(espera);
      espera = setTimeout(() => routerRef.current.refresh(), ESPERA_MS);
    };

    let canal: ReturnType<typeof supabase.channel> | undefined;
    let ativo = true;

    // O canal precisa do token do usuário (senão entra como anônimo e o RLS filtra tudo).
    void supabase.auth.getSession().then(({ data }) => {
      if (!ativo) return;
      void supabase.realtime.setAuth(data.session?.access_token ?? null);
      canal = supabase
        .channel("planejamento")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "atividades" }, (p) => {
          window.dispatchEvent(new CustomEvent(EVENTO_ATIVIDADE, { detail: p.new }));
          atualizar();
        })
        // Reordenações não entram no histórico: escuta direto.
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "frentes" }, atualizar)
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "itens" }, atualizar)
        .subscribe();
    });

    return () => {
      ativo = false;
      clearTimeout(espera);
      if (canal) void supabase.removeChannel(canal);
    };
  }, []);

  return null;
}
