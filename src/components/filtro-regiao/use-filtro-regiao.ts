"use client";

import { useCallback, useSyncExternalStore } from "react";
import { REGIOES_ITEM, type RegiaoItem } from "@/lib/constantes";

/**
 * Filtro de região global (barra superior): vale para a Visão geral e para as
 * abas de frente. Fica guardado neste navegador (localStorage).
 */
export type FiltroRegiao = "todos" | RegiaoItem;

const CHAVE = "m024:regiao";
const EVENTO = "m024:regiao";
/** Reserva quando o navegador não deixa usar o localStorage. */
let emMemoria: FiltroRegiao = "todos";

function ler(): FiltroRegiao {
  try {
    const v = window.localStorage.getItem(CHAVE);
    return v && (REGIOES_ITEM as string[]).includes(v) ? (v as RegiaoItem) : "todos";
  } catch {
    return emMemoria;
  }
}

function assinar(avisar: () => void) {
  const aoArmazenar = (e: StorageEvent) => e.key === CHAVE && avisar();
  window.addEventListener("storage", aoArmazenar);
  window.addEventListener(EVENTO, avisar);
  return () => {
    window.removeEventListener("storage", aoArmazenar);
    window.removeEventListener(EVENTO, avisar);
  };
}

export function useFiltroRegiao(): [FiltroRegiao, (f: FiltroRegiao) => void] {
  const filtro = useSyncExternalStore(assinar, ler, () => "todos" as const);
  const definir = useCallback((f: FiltroRegiao) => {
    emMemoria = f;
    try {
      if (f === "todos") window.localStorage.removeItem(CHAVE);
      else window.localStorage.setItem(CHAVE, f);
    } catch {
      /* sem armazenamento (ex.: janela anônima): o filtro vale só até recarregar */
    }
    window.dispatchEvent(new Event(EVENTO));
  }, []);
  return [filtro, definir];
}

export function filtrarPorRegiao<T extends { regiao: RegiaoItem }>(
  itens: T[],
  filtro: FiltroRegiao,
): T[] {
  return filtro === "todos" ? itens : itens.filter((i) => i.regiao === filtro);
}
