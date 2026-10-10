"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useItens } from "@/components/itens/provedor-itens";

export function BotaoNovoItem({ frenteId, className }: { frenteId?: string; className?: string }) {
  const { novoItem } = useItens();
  return (
    <Button className={className} onClick={() => novoItem({ frente_id: frenteId })}>
      <Plus aria-hidden /> Novo item
    </Button>
  );
}
