import "server-only";
import { cache } from "react";
import { criarClienteServidor } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type Frente = Database["public"]["Tables"]["frentes"]["Row"];

/** Frentes ativas, na ordem das abas. Memoizado por requisição. */
export const listarFrentes = cache(async (): Promise<Frente[]> => {
  const supabase = await criarClienteServidor();
  const { data } = await supabase
    .from("frentes")
    .select("*")
    .is("archived_at", null)
    .order("ordem")
    .order("created_at");
  return data ?? [];
});

/** Todas as frentes, inclusive arquivadas (Admin › Frentes), com a contagem de itens. */
export async function listarTodasFrentes() {
  const supabase = await criarClienteServidor();
  const { data } = await supabase
    .from("frentes")
    .select("*, itens(count)")
    .order("archived_at", { nullsFirst: true })
    .order("ordem");
  return (data ?? []).map(({ itens, ...f }) => ({ ...f, totalItens: itens[0]?.count ?? 0 }));
}

export const obterFrente = cache(async (id: string): Promise<Frente | null> => {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await criarClienteServidor();
  const { data } = await supabase.from("frentes").select("*").eq("id", id).maybeSingle();
  return data;
});
