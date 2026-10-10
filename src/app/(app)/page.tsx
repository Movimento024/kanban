import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ProvedorItens } from "@/components/itens/provedor-itens";
import { VisaoGeral } from "@/components/visao-geral/visao-geral";
import { listarFrentes } from "@/server/consultas/frentes";
import { obterPanorama } from "@/server/consultas/panorama";
import { exigirPerfil } from "@/server/sessao";

async function Conteudo() {
  const [perfil, panorama, frentes] = await Promise.all([
    exigirPerfil(),
    obterPanorama(),
    listarFrentes(),
  ]);
  return (
    <ProvedorItens frentes={frentes} eAdmin={perfil.papel === "admin"}>
      <VisaoGeral panorama={panorama} frentes={frentes} primeiroNome={perfil.nome.split(" ")[0]} />
    </ProvedorItens>
  );
}

function Carregando() {
  return (
    <div className="grid gap-8">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-8 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  );
}

export default function PaginaVisaoGeral() {
  return (
    <Suspense fallback={<Carregando />}>
      <Conteudo />
    </Suspense>
  );
}
