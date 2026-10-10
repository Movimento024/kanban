"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { DialogItem, type PadraoItem } from "@/components/itens/dialog-item";
import type { Frente } from "@/server/consultas/frentes";
import type { ItemResumo } from "@/server/consultas/itens";

type Contexto = {
  novoItem: (padrao?: PadraoItem) => void;
  abrirItem: (item: ItemResumo) => void;
};

const ContextoItens = createContext<Contexto | null>(null);

/** Dá às visualizações (linha do tempo, listas) um jeito único de criar e abrir itens. */
export function ProvedorItens({
  frentes,
  eAdmin,
  children,
}: {
  frentes: Frente[];
  eAdmin: boolean;
  children: React.ReactNode;
}) {
  const [aberto, setAberto] = useState<
    { tipo: "novo"; padrao?: PadraoItem } | { tipo: "editar"; item: ItemResumo } | null
  >(null);

  const novoItem = useCallback((padrao?: PadraoItem) => setAberto({ tipo: "novo", padrao }), []);
  const abrirItem = useCallback((item: ItemResumo) => setAberto({ tipo: "editar", item }), []);
  const fechar = useCallback(() => setAberto(null), []);
  const valor = useMemo(() => ({ novoItem, abrirItem }), [novoItem, abrirItem]);

  return (
    <ContextoItens.Provider value={valor}>
      {children}
      <DialogItem
        aberto={!!aberto}
        item={aberto?.tipo === "editar" ? aberto.item : undefined}
        padrao={aberto?.tipo === "novo" ? aberto.padrao : undefined}
        frentes={frentes}
        eAdmin={eAdmin}
        aoFechar={fechar}
      />
    </ContextoItens.Provider>
  );
}

export function useItens() {
  const ctx = useContext(ContextoItens);
  if (!ctx) throw new Error("useItens precisa estar dentro de <ProvedorItens>");
  return ctx;
}
