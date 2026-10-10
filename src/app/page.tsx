import { Suspense } from "react";
import { connection } from "next/server";
import { Skeleton } from "@/components/ui/skeleton";
import { criarClienteAdmin } from "@/lib/supabase/admin";

// Página provisória da Fase 1: confirma a conexão com o banco e os dados do seed.
// Será substituída pela Visão geral (com login) nas próximas fases.
async function Contagens() {
  await connection();

  const contagens: { rotulo: string; total: number | null }[] = [];
  let erro: string | null = null;

  if (process.env.NODE_ENV === "production") {
    erro = "Página de diagnóstico disponível apenas em desenvolvimento.";
  } else {
    const supabase = criarClienteAdmin();
    const tabelas = [
      ["frentes", "Frentes"],
      ["itens", "Itens"],
      ["decisoes", "Decisões"],
      ["decisao_opcoes", "Opções de decisão"],
      ["notas", "Notas"],
      ["perfis", "Pessoas"],
    ] as const;

    for (const [tabela, rotulo] of tabelas) {
      const { count, error } = await supabase
        .from(tabela)
        .select("*", { count: "exact", head: true });
      if (error) {
        erro = "Não foi possível conectar ao banco. Verifique se o Supabase está rodando.";
        break;
      }
      contagens.push({ rotulo, total: count });
    }
  }

  return (
    <>
      {erro ? (
        <p className="border-destructive/40 bg-destructive/10 rounded-lg border p-4 text-sm">
          {erro}
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {contagens.map((c) => (
            <li key={c.rotulo} className="rounded-lg border p-4">
              <p className="text-3xl font-semibold tabular-nums">{c.total}</p>
              <p className="text-muted-foreground text-sm">{c.rotulo}</p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default function Inicio() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-16">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Movimento 024</h1>
        <p className="text-muted-foreground">Planejamento 2026–2028 — em construção (Fase 1).</p>
      </div>
      <Suspense
        fallback={
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-[86px] rounded-lg" />
            ))}
          </div>
        }
      >
        <Contagens />
      </Suspense>
    </main>
  );
}
