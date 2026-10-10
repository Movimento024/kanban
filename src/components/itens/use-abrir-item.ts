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

  const abrir = useCallback(
    (id: string) => {
      const p = new URLSearchParams(params);
      p.set("item", id);
      router.push(`${caminho}?${p}`, { scroll: false });
    },
    [router, caminho, params],
  );

  const fechar = useCallback(() => {
    const p = new URLSearchParams(params);
    p.delete("item");
    const qs = p.toString();
    router.replace(qs ? `${caminho}?${qs}` : caminho, { scroll: false });
  }, [router, caminho, params]);

  return { itemAberto: params.get("item"), abrir, fechar };
}
