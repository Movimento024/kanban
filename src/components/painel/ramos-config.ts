import { CircleHelp, ListChecks, MessageSquareText, Users, type LucideIcon } from "lucide-react";
import type { DetalheItem } from "@/server/consultas/detalhe-item";

export type ChaveRamo = "lideres" | "tarefas" | "decisoes" | "notas";

/** Os quatro ramos do item. Lado: 1 = direita do nó central, -1 = esquerda. */
export const RAMOS: {
  chave: ChaveRamo;
  titulo: string;
  icone: LucideIcon;
  cor: string;
  lado: 1 | -1;
  rotuloAdicionar: string;
}[] = [
  {
    chave: "lideres",
    titulo: "Líderes",
    icone: Users,
    cor: "#0ea5e9",
    lado: 1,
    rotuloAdicionar: "Adicionar pessoa",
  },
  {
    chave: "tarefas",
    titulo: "Tarefas",
    icone: ListChecks,
    cor: "#10b981",
    lado: 1,
    rotuloAdicionar: "Adicionar tarefa",
  },
  {
    chave: "decisoes",
    titulo: "Decisões",
    icone: CircleHelp,
    cor: "#f59e0b",
    lado: -1,
    rotuloAdicionar: "Adicionar decisão",
  },
  {
    chave: "notas",
    titulo: "Notas",
    icone: MessageSquareText,
    cor: "#e11d48",
    lado: -1,
    rotuloAdicionar: "Adicionar nota",
  },
];

/** Número mostrado no ramo. Tarefas: "concluídas/total"; decisões: abertas/total. */
export function contagemRamo(chave: ChaveRamo, d: DetalheItem): string {
  switch (chave) {
    case "lideres":
      return String(d.atribuicoes.length);
    case "tarefas": {
      const feitas = d.tarefas.filter((t) => t.concluida).length;
      return d.tarefas.length ? `${feitas}/${d.tarefas.length}` : "0";
    }
    case "decisoes": {
      const abertas = d.decisoes.filter((x) => x.status === "aberta").length;
      return abertas ? `${abertas} ?` : String(d.decisoes.length);
    }
    case "notas":
      return String(d.notas.length);
  }
}
