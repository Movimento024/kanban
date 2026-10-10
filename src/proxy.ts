import type { NextRequest } from "next/server";
import { atualizarSessao } from "@/lib/supabase/proxy";

// Fase 1: apenas mantém a sessão renovada. Redirecionamentos de login e de
// troca obrigatória de senha entram na Fase 2.
export async function proxy(request: NextRequest) {
  const { response } = await atualizarSessao(request);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
