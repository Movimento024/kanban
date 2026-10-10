import { NextResponse, type NextRequest } from "next/server";
import { atualizarSessao } from "@/lib/supabase/proxy";

const ROTAS_PUBLICAS = ["/login", "/sair"];

/**
 * Renova a sessão e faz os redirecionamentos de navegação a partir das claims
 * do token (papel, ativo, precisa_trocar_senha — ver migration de claims).
 * Isto é só conveniência de navegação: páginas e actions checam o perfil no
 * banco e o RLS garante as permissões.
 */
export async function proxy(request: NextRequest) {
  const { response, claims } = await atualizarSessao(request);
  const { pathname, search } = request.nextUrl;
  const publica = ROTAS_PUBLICAS.some((r) => pathname === r || pathname.startsWith(`${r}/`));

  const redirecionar = (destino: string) => {
    const url = request.nextUrl.clone();
    const [caminho, query] = destino.split("?");
    url.pathname = caminho;
    url.search = query ? `?${query}` : "";
    const r = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => r.cookies.set(c));
    return r;
  };

  if (!claims) {
    if (publica) return response;
    const proximo = pathname === "/" ? "" : `?proximo=${encodeURIComponent(pathname + search)}`;
    return redirecionar(`/login${proximo}`);
  }

  if (claims.ativo === false) {
    return pathname === "/sair" ? response : redirecionar("/sair?motivo=inativo");
  }

  if (pathname === "/login") return redirecionar("/");

  if (claims.precisa_trocar_senha && pathname !== "/trocar-senha" && pathname !== "/sair") {
    return redirecionar("/trocar-senha");
  }
  if (!claims.precisa_trocar_senha && pathname === "/trocar-senha") return redirecionar("/");

  if (pathname.startsWith("/admin") && claims.papel !== "admin") return redirecionar("/");

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
