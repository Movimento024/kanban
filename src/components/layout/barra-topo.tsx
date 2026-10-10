import { Suspense } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { MenuAvatar } from "@/components/layout/menu-avatar";
import { exigirPerfil } from "@/server/sessao";

async function MenuUsuario() {
  const perfil = await exigirPerfil();
  return <MenuAvatar perfil={perfil} />;
}

export function BarraTopo() {
  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-4 px-4">
        <Link href="/" className="font-semibold tracking-tight whitespace-nowrap">
          Movimento 024
        </Link>
        {/* Abas das frentes entram na Fase 3 */}
        <div className="flex-1" />
        <Suspense fallback={<Skeleton className="size-9 rounded-full" />}>
          <MenuUsuario />
        </Suspense>
      </div>
    </header>
  );
}
