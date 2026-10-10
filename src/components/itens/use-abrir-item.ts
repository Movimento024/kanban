"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * O item aberto fica na URL (?item=<id>): o link pode ser compartilhado (ex.: no
 * WhatsApp) e abre direto no item, em qualquer aba. Fechar remove o parâmetro.
 */
export function useAbrirItem() {
  const router = useRouter();
  const caminho = usePathname();
  const params = useSearchParams();

  // Lê a query string na hora (e não de useSearchParams) para abrir/fechar terem
  // identidade estável: atualizações da rota (ex.: tempo real) não recarregam o painel.
  const abrir = useCallback(
    (id: string) => {
      const p = new URLSearchParams(window.location.search);
      p.set("item", id);
      router.push(`${caminho}?${p}`, { scroll: false });
    },
    [router, caminho],
  );

  const fechar = useCallback(() => {
    const p = new URLSearchParams(window.location.search);
    p.delete("item");
    const qs = p.toString();
    router.replace(qs ? `${caminho}?${qs}` : caminho, { scroll: false });
  }, [router, caminho]);

  return { itemAberto: params.get("item"), abrir, fechar };
}
