"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { LogOut, Monitor, Moon, Shield, Sun, UserRound } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AvatarPessoa } from "@/components/comum/avatar-pessoa";
import { ROTULO_PAPEL, ROTULO_REGIAO_PESSOA } from "@/lib/constantes";
import { sair } from "@/server/actions/auth";
import type { Perfil } from "@/server/sessao";

export function MenuAvatar({ perfil }: { perfil: Perfil }) {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="focus-visible:ring-ring rounded-full outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        aria-label="Abrir menu da conta"
      >
        <AvatarPessoa
          nome={perfil.nome}
          iniciais={perfil.iniciais}
          regiao={perfil.regiao}
          className="size-9"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate font-medium">{perfil.nome}</p>
          <p className="text-muted-foreground truncate text-xs">
            {ROTULO_PAPEL[perfil.papel]} · {ROTULO_REGIAO_PESSOA[perfil.regiao]}
          </p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/conta">
              <UserRound aria-hidden /> Minha conta
            </Link>
          </DropdownMenuItem>
          {perfil.papel === "admin" && (
            <DropdownMenuItem asChild>
              <Link href="/admin/usuarios">
                <Shield aria-hidden /> Admin
              </Link>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-muted-foreground text-xs">Tema</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={theme ?? "system"} onValueChange={setTheme}>
          <DropdownMenuRadioItem value="light">
            <Sun aria-hidden /> Claro
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">
            <Moon aria-hidden /> Escuro
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">
            <Monitor aria-hidden /> Seguir o sistema
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <form action={sair}>
          <DropdownMenuItem asChild>
            <button type="submit" className="w-full">
              <LogOut aria-hidden /> Sair
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
