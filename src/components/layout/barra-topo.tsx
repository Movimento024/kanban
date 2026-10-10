import { Suspense } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { BarraAbas } from "@/components/layout/barra-abas";
import { MenuAvatar } from "@/components/layout/menu-avatar";
import { listarFrentes } from "@/server/consultas/frentes";
import { exigirPerfil } from "@/server/sessao";

async function MenuUsuario() {
  const perfil = await exigirPerfil();
  return <MenuAvatar perfil={perfil} />;
}

async function Abas() {
  const [perfil, frentes] = await Promise.all([exigirPerfil(), listarFrentes()]);
  return <BarraAbas frentes={frentes} eAdmin={perfil.papel === "admin"} />;
}

function AbasCarregando() {
  return (
    <div className="border-b">
      <div className="mx-auto flex h-11 w-full max-w-7xl items-center gap-4 overflow-hidden px-4">
        {[90, 80, 70, 72, 60, 96, 80].map((w, i) => (
          <Skeleton key={i} className="h-4 shrink-0" style={{ width: w }} />
        ))}
      </div>
    </div>
  );
}

export function BarraTopo() {
  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-40 backdrop-blur">
      <div className="mx-auto flex h-12 w-full max-w-7xl items-center gap-4 px-4">
        <Link href="/" className="font-semibold tracking-tight whitespace-nowrap">
          Movimento 024
        </Link>
        {/* Busca e filtro global de região entram com a Visão geral */}
        <div className="flex-1" />
        <Suspense fallback={<Skeleton className="size-9 rounded-full" />}>
          <MenuUsuario />
        </Suspense>
      </div>
      <Suspense fallback={<AbasCarregando />}>
        <Abas />
      </Suspense>
    </header>
  );
}
