import { Suspense } from "react";
import { BarraTopo } from "@/components/layout/barra-topo";
import { PainelServidor } from "@/components/painel/painel-servidor";
import { SincronizacaoTempoReal } from "@/components/tempo-real/sincronizacao";

export default function LayoutApp({ children }: LayoutProps<"/">) {
  return (
    <>
      {/* Acessibilidade: quem navega pelo teclado pula a barra de abas. */}
      <a
        href="#conteudo"
        className="bg-primary text-primary-foreground sr-only z-50 rounded-md px-3 py-2 text-sm font-medium focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Pular para o conteúdo
      </a>
      <BarraTopo />
      {/* Atualiza as telas quando alguém muda algo (Supabase Realtime) */}
      <SincronizacaoTempoReal />
      <main id="conteudo" tabIndex={-1} className="mx-auto outline-none flex w-full max-w-7xl min-w-0 flex-1 flex-col px-4 py-6">
        {children}
      </main>
      {/* Painel do item: abre em qualquer tela via ?item=<id> */}
      <Suspense fallback={null}>
        <PainelServidor />
      </Suspense>
    </>
  );
}
