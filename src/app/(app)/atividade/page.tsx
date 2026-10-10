import type { Metadata } from "next";
import { History } from "lucide-react";
import { EstadoVazio } from "@/components/comum/estado-vazio";

export const metadata: Metadata = { title: "Atividade · Movimento 024" };

export default function PaginaAtividade() {
  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Atividade</h1>
      <EstadoVazio
        icone={History}
        titulo="Em construção"
        descricao="O histórico de quem alterou o quê já está sendo gravado; a tela chega na Fase 8."
      />
    </div>
  );
}
