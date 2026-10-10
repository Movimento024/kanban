import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Skeleton } from "@/components/ui/skeleton";
import { CabecalhoFrente } from "@/components/frentes/cabecalho-frente";
import { ListaItens } from "@/components/frentes/lista-itens";
import { AvisoLayoutEmBreve } from "@/components/frentes/aviso-layout";
import { listarFrentes, obterFrente } from "@/server/consultas/frentes";
import { listarItensDaFrente } from "@/server/consultas/itens";
import { exigirPerfil } from "@/server/sessao";

export async function generateMetadata({ params }: PageProps<"/frentes/[id]">): Promise<Metadata> {
  const { id } = await params;
  const frente = await obterFrente(id);
  return { title: `${frente?.nome ?? "Frente"} · Movimento 024` };
}

async function ConteudoFrente({ params }: { params: PageProps<"/frentes/[id]">["params"] }) {
  const { id } = await params;
  const [perfil, frente, frentes] = await Promise.all([
    exigirPerfil(),
    obterFrente(id),
    listarFrentes(),
  ]);
  if (!frente || frente.archived_at) notFound();

  const itens = await listarItensDaFrente(frente.id);

  return (
    <div className="grid gap-6">
      <CabecalhoFrente
        frente={frente}
        outrasFrentes={frentes.filter((f) => f.id !== frente.id)}
        totalItens={itens.length}
        eAdmin={perfil.papel === "admin"}
      />
      {frente.layout !== "lista" && <AvisoLayoutEmBreve layout={frente.layout} />}
      <ListaItens frente={frente} itens={itens} />
    </div>
  );
}

function Carregando() {
  return (
    <div className="grid gap-6">
      <div className="flex items-center gap-3">
        <Skeleton className="size-11 rounded-xl" />
        <div className="grid gap-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      <div className="grid gap-2">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function PaginaFrente({ params }: PageProps<"/frentes/[id]">) {
  return (
    <Suspense fallback={<Carregando />}>
      <ConteudoFrente params={params} />
    </Suspense>
  );
}
