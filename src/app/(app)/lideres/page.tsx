import { Suspense } from "react";
import type { Metadata } from "next";
import { Skeleton } from "@/components/ui/skeleton";
import { ProvedorItens } from "@/components/itens/provedor-itens";
import { PorLider } from "@/components/lideres/por-lider";
import { listarFrentes } from "@/server/consultas/frentes";
import { obterPanorama } from "@/server/consultas/panorama";
import { exigirPerfil } from "@/server/sessao";

export const metadata: Metadata = { title: "Por líder · Movimento 024" };

async function Conteudo() {
  const [perfil, panorama, frentes] = await Promise.all([
    exigirPerfil(),
    obterPanorama(),
    listarFrentes(),
  ]);
  const eAdmin = perfil.papel === "admin";
  return (
    <ProvedorItens frentes={frentes} eAdmin={eAdmin}>
      <PorLider panorama={panorama} frentes={frentes} eAdmin={eAdmin} />
    </ProvedorItens>
  );
}

function Carregando() {
  return (
    <div className="grid gap-4">
      <Skeleton className="h-10 w-64" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function PaginaLideres() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Por líder</h1>
        <p className="text-muted-foreground text-sm">Quem cuida de quê.</p>
      </div>
      <Suspense fallback={<Carregando />}>
        <Conteudo />
      </Suspense>
    </div>
  );
}
