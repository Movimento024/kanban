"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { FileText, Layers, Loader2, Search, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { carregarIndiceBusca, type IndiceBusca } from "@/server/actions/busca";

const normalizar = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

/**
 * Todas as palavras digitadas precisam aparecer (sem diferenciar acento e
 * maiúscula). Compara só as palavras-chave: o `value` é um id interno.
 */
function filtrar(_valor: string, busca: string, palavrasChave?: string[]) {
  const alvo = normalizar((palavrasChave ?? []).join(" "));
  const termos = normalizar(busca).split(/\s+/).filter(Boolean);
  return termos.every((t) => alvo.includes(t)) ? 1 : 0;
}

/** Busca da barra superior (Ctrl+K): itens, frentes e pessoas. */
export function BuscaGlobal() {
  const router = useRouter();
  const caminho = usePathname();
  const [aberta, setAberta] = useState(false);
  const [indice, setIndice] = useState<IndiceBusca | null>(null);
  const [carregando, iniciar] = useTransition();

  useEffect(() => {
    function atalho(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setAberta((a) => !a);
      }
    }
    window.addEventListener("keydown", atalho);
    return () => window.removeEventListener("keydown", atalho);
  }, []);

  // Recarrega o índice a cada abertura (é pequeno e assim vem sempre atualizado).
  useEffect(() => {
    if (!aberta) return;
    iniciar(async () => {
      const r = await carregarIndiceBusca();
      if (r.ok) setIndice(r.data);
      else toast.error(r.erro);
    });
  }, [aberta]);

  const ir = (href: string) => {
    setAberta(false);
    router.push(href);
  };
  const abrirItem = (id: string) => {
    const p = new URLSearchParams(window.location.search);
    p.set("item", id);
    ir(`${caminho}?${p}`);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setAberta(true)}
        className="text-muted-foreground gap-2 max-sm:size-8 max-sm:px-0 sm:w-56 sm:justify-start"
        aria-label="Buscar"
      >
        <Search aria-hidden />
        <span className="max-sm:sr-only">Buscar…</span>
        <kbd className="bg-muted ml-auto hidden rounded px-1.5 font-mono text-[10px] sm:inline">
          Ctrl K
        </kbd>
      </Button>

      <CommandDialog
        open={aberta}
        onOpenChange={setAberta}
        title="Buscar"
        description="Busque itens, frentes e pessoas"
      >
        <Command filter={filtrar} loop>
          <CommandInput placeholder="Buscar itens, frentes e pessoas…" />
          <CommandList>
            {carregando && !indice ? (
              <div className="text-muted-foreground flex items-center justify-center gap-2 py-6 text-sm">
                <Loader2 className="size-4 animate-spin" aria-hidden /> Carregando…
              </div>
            ) : (
              <CommandEmpty>Nada encontrado.</CommandEmpty>
            )}
            {indice && (
              <>
                <CommandGroup heading="Itens">
                  {indice.itens.map((i) => (
                    <CommandItem
                      key={i.id}
                      value={`item-${i.id}`}
                      keywords={[i.titulo, i.frente, i.detalhe]}
                      onSelect={() => abrirItem(i.id)}
                    >
                      <FileText aria-hidden />
                      <span className="grid min-w-0">
                        <span className="truncate">{i.titulo}</span>
                        <span className="text-muted-foreground truncate text-xs">
                          {i.frente}
                          {i.detalhe && ` · ${i.detalhe}`}
                        </span>
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandGroup heading="Frentes">
                  {indice.frentes.map((f) => (
                    <CommandItem
                      key={f.id}
                      value={`frente-${f.id}`}
                      keywords={[f.nome, "frente"]}
                      onSelect={() => ir(`/frentes/${f.id}`)}
                    >
                      <Layers aria-hidden />
                      {f.nome}
                    </CommandItem>
                  ))}
                </CommandGroup>
                <CommandGroup heading="Pessoas">
                  {indice.pessoas.map((p) => (
                    <CommandItem
                      key={p.id}
                      value={`pessoa-${p.id}`}
                      keywords={[p.nome]}
                      onSelect={() => ir(`/lideres/${p.id}`)}
                    >
                      <UserRound aria-hidden />
                      {p.nome}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
