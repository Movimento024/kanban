import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type Perfil = Database["public"]["Tables"]["perfis"]["Row"];

/**
 * Perfil do usuário logado, lido do banco (fonte da verdade, não do token).
 * Retorna null se não há sessão ou se o perfil está inativo (o RLS esconde).
 * Memoizado por requisição.
 */
export const obterPerfilAtual = cache(async (): Promise<Perfil | null> => {
  const supabase = await criarClienteServidor();
  const { data: claims } = await supabase.auth.getClaims();
  const id = claims?.claims.sub;
  if (!id) return null;

  const { data } = await supabase.from("perfis").select("*").eq("id", id).maybeSingle();
  if (!data || !data.ativo) return null;
  return data;
});

/** Para páginas: exige usuário logado e ativo. */
export async function exigirPerfil(): Promise<Perfil> {
  const perfil = await obterPerfilAtual();
  // Sessão existe mas o perfil sumiu ou foi desativado: encerra a sessão.
  if (!perfil) redirect("/sair?motivo=inativo");
  if (perfil.precisa_trocar_senha) redirect("/trocar-senha");
  return perfil;
}

/** Para páginas de admin. */
export async function exigirAdmin(): Promise<Perfil> {
  const perfil = await exigirPerfil();
  if (perfil.papel !== "admin") redirect("/");
  return perfil;
}
