import { Suspense } from "react";
import type { Metadata } from "next";
import { Skeleton } from "@/components/ui/skeleton";
import { ListaFrentesAdmin } from "@/components/admin/lista-frentes-admin";
import { listarTodasFrentes } from "@/server/consultas/frentes";
import { exigirAdmin } from "@/server/sessao";

export const metadata: Metadata = { title: "Frentes · Admin · Movimento 024" };

async function Frentes() {
  await exigirAdmin();
  const frentes = await listarTodasFrentes();
  return <ListaFrentesAdmin frentes={frentes} />;
}

export default function PaginaFrentesAdmin() {
  return (
    <Suspense
      fallback={
        <div className="grid gap-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      }
    >
      <Frentes />
    </Suspense>
  );
}
