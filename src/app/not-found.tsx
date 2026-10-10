import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NaoEncontrado() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-16 text-center">
      <SearchX className="text-muted-foreground size-10" aria-hidden />
      <h1 className="text-xl font-semibold">Página não encontrada</h1>
      <p className="text-muted-foreground max-w-sm text-sm">
        Ela pode ter sido arquivada, excluída ou o link está incompleto.
      </p>
      <Button asChild variant="outline">
        <Link href="/">Voltar para o início</Link>
      </Button>
    </main>
  );
}
