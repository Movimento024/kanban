import type { Metadata } from "next";
import { Users } from "lucide-react";
import { EstadoVazio } from "@/components/comum/estado-vazio";

export const metadata: Metadata = { title: "Por líder · Movimento 024" };

export default function PaginaLideres() {
  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Por líder</h1>
      <EstadoVazio
        icone={Users}
        titulo="Em construção"
        descricao="Aqui vai dar para ver quem cuida de quê. Chega na Fase 7."
      />
    </div>
  );
}
