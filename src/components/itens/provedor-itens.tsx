"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { DialogItem, type PadraoItem } from "@/components/itens/dialog-item";
import { useAbrirItem } from "@/components/itens/use-abrir-item";
import type { Frente } from "@/server/consultas/frentes";

type Contexto = {
  novoItem: (padrao?: PadraoItem) => void;
  abrirItem: (id: string) => void;
};

const ContextoItens = createContext<Contexto | null>(null);

/**
 * Dá às visualizações (linha do tempo, listas) um jeito único de criar itens e
 * abrir o painel do item. Depois de criar, o painel do item novo abre sozinho.
 */
export function ProvedorItens({
  frentes,
  eAdmin,
  children,
}: {
  frentes: Frente[];
  eAdmin: boolean;
  children: React.ReactNode;
}) {
  const { abrir } = useAbrirItem();
  const [novo, setNovo] = useState<{ padrao?: PadraoItem } | null>(null);

  const novoItem = useCallback((padrao?: PadraoItem) => setNovo({ padrao }), []);
  const fechar = useCallback(() => setNovo(null), []);
  const valor = useMemo(() => ({ novoItem, abrirItem: abrir }), [novoItem, abrir]);

  return (
    <ContextoItens.Provider value={valor}>
      {children}
      <DialogItem
        aberto={!!novo}
        padrao={novo?.padrao}
        frentes={frentes}
        eAdmin={eAdmin}
        aoFechar={fechar}
        aoCriar={abrir}
      />
    </ContextoItens.Provider>
  );
}

export function useItens() {
  const ctx = useContext(ContextoItens);
  if (!ctx) throw new Error("useItens precisa estar dentro de <ProvedorItens>");
  return ctx;
}
