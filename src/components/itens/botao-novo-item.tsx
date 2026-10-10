"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useItens } from "@/components/itens/provedor-itens";
import type { RegiaoItem } from "@/lib/constantes";

export function BotaoNovoItem({
  frenteId,
  regiao,
  className,
}: {
  frenteId?: string;
  regiao?: RegiaoItem;
  className?: string;
}) {
  const { novoItem } = useItens();
  return (
    <Button className={className} onClick={() => novoItem({ frente_id: frenteId, regiao })}>
      <Plus aria-hidden /> Novo item
    </Button>
  );
}
