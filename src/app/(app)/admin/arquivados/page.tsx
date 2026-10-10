import { Suspense } from "react";
import type { Metadata } from "next";
import { Skeleton } from "@/components/ui/skeleton";
import { ListaArquivados } from "@/components/admin/lista-arquivados";
import { listarArquivados } from "@/server/consultas/arquivados";
import { exigirAdmin } from "@/server/sessao";

export const metadata: Metadata = { title: "Arquivados · Admin · Movimento 024" };

async function Arquivados() {
  await exigirAdmin();
  return <ListaArquivados arquivados={await listarArquivados()} />;
}

export default function PaginaArquivados() {
  return (
    <Suspense
      fallback={
        <div className="grid gap-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      }
    >
      <Arquivados />
    </Suspense>
  );
}
