import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Skeleton } from "@/components/ui/skeleton";
import { ProvedorItens } from "@/components/itens/provedor-itens";
import { VisaoIndividual } from "@/components/lideres/visao-individual";
import { listarFrentes } from "@/server/consultas/frentes";
import { obterPanorama } from "@/server/consultas/panorama";
import { exigirPerfil } from "@/server/sessao";

export const metadata: Metadata = { title: "Por líder · Movimento 024" };

async function Conteudo({ params }: { params: PageProps<"/lideres/[id]">["params"] }) {
  const { id } = await params;
  const [perfil, panorama, frentes] = await Promise.all([
    exigirPerfil(),
    obterPanorama(),
    listarFrentes(),
  ]);
  const pessoa = panorama.pessoas.find((p) => p.id === id);
  if (!pessoa) notFound();

  return (
    <ProvedorItens frentes={frentes} eAdmin={perfil.papel === "admin"}>
      <VisaoIndividual
        pessoa={pessoa}
        panorama={panorama}
        frentes={frentes}
        euMesmo={perfil.id === pessoa.id}
      />
    </ProvedorItens>
  );
}

function Carregando() {
  return (
    <div className="grid gap-8">
      <div className="flex items-center gap-4">
        <Skeleton className="size-14 rounded-full" />
        <div className="grid gap-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
      </div>
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="grid gap-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export default function PaginaPessoa({ params }: PageProps<"/lideres/[id]">) {
  return (
    <Suspense fallback={<Carregando />}>
      <Conteudo params={params} />
    </Suspense>
  );
}
