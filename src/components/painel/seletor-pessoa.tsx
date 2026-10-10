"use client";

import { useState } from "react";
import { Check, UserX } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AvatarPessoa } from "@/components/comum/avatar-pessoa";
import { ROTULO_REGIAO_PESSOA } from "@/lib/constantes";
import type { PessoaResumo } from "@/server/consultas/itens";

/** Busca de pessoa (por nome) num popover. `permitirNinguem` mostra "Ninguém". */
export function SeletorPessoa({
  pessoas,
  selecionados = [],
  aoEscolher,
  permitirNinguem = false,
  children,
  titulo = "Escolher pessoa",
}: {
  pessoas: PessoaResumo[];
  selecionados?: string[];
  aoEscolher: (pessoa: PessoaResumo | null) => void;
  permitirNinguem?: boolean;
  children: React.ReactNode;
  titulo?: string;
}) {
  const [aberto, setAberto] = useState(false);
  const escolher = (p: PessoaResumo | null) => {
    setAberto(false);
    aoEscolher(p);
  };

  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="nodrag nopan nowheel w-72 p-0" align="start">
        <Command
          // Busca sem acento: "debora" encontra "Débora".
          filter={(valor, busca) => (normalizar(valor).includes(normalizar(busca)) ? 1 : 0)}
        >
          <CommandInput placeholder="Buscar pelo nome" aria-label={titulo} />
          <CommandList>
            <CommandEmpty>Ninguém encontrado.</CommandEmpty>
            <CommandGroup heading={titulo}>
              {permitirNinguem && (
                <CommandItem value="ninguem" onSelect={() => escolher(null)}>
                  <UserX className="size-4" aria-hidden /> Ninguém
                </CommandItem>
              )}
              {pessoas.map((p) => (
                <CommandItem key={p.id} value={`${p.nome} ${p.id}`} onSelect={() => escolher(p)}>
                  <AvatarPessoa
                    nome={p.nome}
                    iniciais={p.iniciais}
                    regiao={p.regiao}
                    tamanho="sm"
                  />
                  <span className="flex-1 truncate">{p.nome}</span>
                  <span className="text-muted-foreground text-xs">
                    {ROTULO_REGIAO_PESSOA[p.regiao]}
                  </span>
                  {selecionados.includes(p.id) && <Check className="size-4" aria-label="já está" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function normalizar(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}
