"use client";

import { startTransition, useCallback, useState } from "react";
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

/**
 * `onSubmit` que chama a action sem o reset automático do React 19 em
 * `<form action>`: o reset dispara "change" no <select> escondido do Radix e
 * volta os seletores (e os erros) ao estado inicial quando a validação falha.
 * Uso: <form onSubmit={enviarSemResetar(acao)}>
 */
export function enviarSemResetar(acao: (form: FormData) => void) {
  return (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const dados = new FormData(e.currentTarget);
    startTransition(() => acao(dados));
  };
}
