"use client";

import { createContext, useContext } from "react";
import type { DetalheItem } from "@/server/consultas/detalhe-item";
import type { Resultado } from "@/server/resultado";

export type ContextoPainel = {
  detalhe: DetalheItem;
  meuId: string;
  eAdmin: boolean;
  /**
   * Roda uma ação do servidor. `otimista` aplica a mudança na tela na hora;
   * se a ação falhar, volta ao estado anterior e avisa. No fim, recarrega.
   */
  executar: (
    acao: () => Promise<Resultado>,
    otimista?: (d: DetalheItem) => DetalheItem,
  ) => Promise<boolean>;
  /** Abre a seção de detalhes do item (ex.: para ajustar a data após uma decisão). */
  abrirDetalhes: () => void;
};

export const Painel = createContext<ContextoPainel | null>(null);

export function usePainel() {
  const ctx = useContext(Painel);
  if (!ctx) throw new Error("usePainel precisa estar dentro do painel do item");
  return ctx;
}
