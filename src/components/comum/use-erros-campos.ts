"use client";

import { useCallback, useState } from "react";
import type { Resultado } from "@/server/resultado";

/**
 * Erros por campo vindos da action, que somem quando a pessoa edita o campo.
 * Uso: const [erros, limpar] = useErrosCampos(estado); <form onChange={limpar}>
 */
export function useErrosCampos(estado: Resultado<unknown> | null) {
  const [anterior, setAnterior] = useState(estado);
  const [erros, setErros] = useState<Record<string, string> | undefined>(undefined);

  // Novo resultado da action: substitui os erros (padrão "ajustar estado no render").
  if (estado !== anterior) {
    setAnterior(estado);
    setErros(estado && !estado.ok ? estado.campos : undefined);
  }

  const limpar = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    const nome = (e.target as HTMLInputElement).name;
    if (!nome) return;
    setErros((atual) => {
      if (!atual?.[nome]) return atual;
      const resto = { ...atual };
      delete resto[nome];
      return resto;
    });
  }, []);

  return [erros, limpar] as const;
}
