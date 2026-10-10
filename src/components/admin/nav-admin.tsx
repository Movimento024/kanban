"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// Arquivados (itens, tarefas, decisões, notas) entra com o painel do item.
const LINKS = [
  { href: "/admin/usuarios", rotulo: "Usuários" },
  { href: "/admin/frentes", rotulo: "Frentes" },
];

export function NavAdmin() {
  const caminho = usePathname();
  return (
    <nav aria-label="Seções do admin" className="flex gap-1 border-b">
      {LINKS.map((l) => {
        const ativo = caminho.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={ativo ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              ativo
                ? "border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground border-transparent",
            )}
          >
            {l.rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
