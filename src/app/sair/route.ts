import { NextResponse, type NextRequest } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/server";

/**
 * Encerra a sessão quando o perfil foi desativado (redirecionamento automático).
 * O botão "Sair" normal usa a server action `sair`.
 */
export async function GET(request: NextRequest) {
  const supabase = await criarClienteServidor();
  await supabase.auth.signOut();

  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = request.nextUrl.searchParams.get("motivo") === "inativo" ? "?motivo=inativo" : "";
  return NextResponse.redirect(url);
}
