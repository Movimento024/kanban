import { Suspense } from "react";
import type { Metadata } from "next";
import { Skeleton } from "@/components/ui/skeleton";
import { ListaUsuarios } from "@/components/admin/lista-usuarios";
import { criarClienteServidor } from "@/lib/supabase/server";
import { exigirAdmin } from "@/server/sessao";

export const metadata: Metadata = { title: "Usuários · Admin · Movimento 024" };

async function Usuarios() {
  const eu = await exigirAdmin();
  const supabase = await criarClienteServidor();
  const { data: perfis, error } = await supabase.from("perfis").select("*").order("nome");

  if (error) {
    return (
      <p className="text-destructive text-sm">
        Não foi possível carregar os usuários. Recarregue a página.
      </p>
    );
  }
  return <ListaUsuarios perfis={perfis} meuId={eu.id} />;
}

export default function PaginaUsuarios() {
  return (
    <Suspense
      fallback={
        <div className="grid gap-4">
          <Skeleton className="h-9 w-full max-w-xs" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      }
    >
      <Usuarios />
    </Suspense>
  );
}
