import { Suspense } from "react";
import type { Metadata } from "next";
import { Skeleton } from "@/components/ui/skeleton";
import { FeedAtividade } from "@/components/atividade/feed-atividade";
import { lerFiltros } from "@/lib/atividade/filtros";
import { listarAtividades, listarPessoasDoHistorico } from "@/server/consultas/atividades";
import { listarTodasFrentes } from "@/server/consultas/frentes";
import { exigirPerfil } from "@/server/sessao";

export const metadata: Metadata = { title: "Atividade · Movimento 024" };

async function Conteudo({
  searchParams,
}: {
  searchParams: PageProps<"/atividade">["searchParams"];
}) {
  const filtros = lerFiltros(await searchParams);
  await exigirPerfil();
  const [{ atividades, temMais }, pessoas, frentes] = await Promise.all([
    listarAtividades(filtros),
    listarPessoasDoHistorico(),
    listarTodasFrentes(),
  ]);
  return (
    <FeedAtividade
      // Filtros novos recomeçam a paginação.
      key={JSON.stringify(filtros)}
      iniciais={atividades}
      temMaisInicial={temMais}
      filtros={filtros}
      pessoas={pessoas}
      frentes={frentes}
    />
  );
}

function Carregando() {
  return (
    <div className="grid gap-5">
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-9 rounded-md" />
        ))}
      </div>
      <div className="grid gap-3">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="size-6 rounded-full" />
            <div className="grid flex-1 gap-1.5">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PaginaAtividade({ searchParams }: PageProps<"/atividade">) {
  return (
    <div className="grid gap-6">
      <div className="grid gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Atividade</h1>
        <p className="text-muted-foreground text-sm">
          Tudo o que mudou no planejamento, do mais recente para o mais antigo.
        </p>
      </div>
      <Suspense fallback={<Carregando />}>
        <Conteudo searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
