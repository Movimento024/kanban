import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { exigirPerfil } from "@/server/sessao";

async function Boas() {
  const perfil = await exigirPerfil();
  const primeiroNome = perfil.nome.split(" ")[0];
  return (
    <div className="grid gap-2">
      <h1 className="text-2xl font-semibold tracking-tight">Olá, {primeiroNome}!</h1>
      <p className="text-muted-foreground">
        A Visão geral do planejamento chega nas próximas fases. Por enquanto, use o menu no seu
        avatar para acessar Minha conta{perfil.papel === "admin" ? " e Admin" : ""}.
      </p>
    </div>
  );
}

export default function VisaoGeral() {
  return (
    <Suspense fallback={<Skeleton className="h-20 w-full max-w-lg" />}>
      <Boas />
    </Suspense>
  );
}
