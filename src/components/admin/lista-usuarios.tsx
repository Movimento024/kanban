"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { KeyRound, MoreHorizontal, Pencil, Search, UserCheck, UserPlus, UserX } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AvatarPessoa } from "@/components/comum/avatar-pessoa";
import { DialogUsuario, DialogRedefinirSenha } from "@/components/admin/dialogs-usuario";
import { ROTULO_PAPEL, ROTULO_REGIAO_PESSOA } from "@/lib/constantes";
import { alterarAtivo } from "@/server/actions/usuarios";
import type { Perfil } from "@/server/sessao";

type Aberto =
  | { tipo: "criar" }
  | { tipo: "editar"; perfil: Perfil }
  | { tipo: "senha"; perfil: Perfil }
  | { tipo: "ativo"; perfil: Perfil }
  | null;

function normalizar(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function ListaUsuarios({ perfis, meuId }: { perfis: Perfil[]; meuId: string }) {
  const [busca, setBusca] = useState("");
  const [aberto, setAberto] = useState<Aberto>(null);
  const [pendente, iniciar] = useTransition();

  const filtrados = useMemo(() => {
    const termo = normalizar(busca.trim());
    if (!termo) return perfis;
    return perfis.filter((p) => normalizar(`${p.nome} ${p.email}`).includes(termo));
  }, [busca, perfis]);

  const ativos = perfis.filter((p) => p.ativo).length;
  const fechar = useCallback(() => setAberto(null), []);

  function confirmarAtivo(p: Perfil) {
    iniciar(async () => {
      const r = await alterarAtivo(p.id, !p.ativo);
      if (r.ok) toast.success(r.mensagem);
      else toast.error(r.erro);
      fechar();
    });
  }

  const acoes = (p: Perfil) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Ações para ${p.nome}`}>
          <MoreHorizontal aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuItem onSelect={() => setAberto({ tipo: "editar", perfil: p })}>
          <Pencil aria-hidden /> Editar
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setAberto({ tipo: "senha", perfil: p })}>
          <KeyRound aria-hidden /> Redefinir senha
        </DropdownMenuItem>
        {p.id !== meuId && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant={p.ativo ? "destructive" : "default"}
              onSelect={() => setAberto({ tipo: "ativo", perfil: p })}
            >
              {p.ativo ? <UserX aria-hidden /> : <UserCheck aria-hidden />}
              {p.ativo ? "Desativar" : "Reativar"}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const situacao = (p: Perfil) => (
    <div className="flex flex-wrap gap-1">
      {!p.ativo && <Badge variant="outline">Inativo</Badge>}
      {p.ativo && p.precisa_trocar_senha && <Badge variant="secondary">Aguardando 1º acesso</Badge>}
      {p.ativo && !p.precisa_trocar_senha && <Badge variant="outline">Ativo</Badge>}
    </div>
  );

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
            aria-hidden
          />
          <Input
            type="search"
            placeholder="Buscar por nome ou e-mail"
            aria-label="Buscar usuários"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="h-10 pl-8 md:h-9"
          />
        </div>
        <p className="text-muted-foreground text-sm sm:flex-1">
          {ativos} ativo{ativos === 1 ? "" : "s"} de {perfis.length}
        </p>
        <Button className="h-10 md:h-9" onClick={() => setAberto({ tipo: "criar" })}>
          <UserPlus aria-hidden /> Novo usuário
        </Button>
      </div>

      {filtrados.length === 0 ? (
        <div className="text-muted-foreground rounded-xl border border-dashed p-10 text-center text-sm">
          {busca
            ? `Ninguém encontrado para “${busca}”.`
            : "Nenhum usuário ainda — crie o primeiro."}
        </div>
      ) : (
        <>
          {/* Celular: cartões */}
          <ul className="grid gap-2 md:hidden">
            {filtrados.map((p) => (
              <li key={p.id} className="flex items-center gap-3 rounded-xl border p-3">
                <AvatarPessoa
                  nome={p.nome}
                  iniciais={p.iniciais}
                  regiao={p.regiao}
                  ativo={p.ativo}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {p.nome}
                    {p.id === meuId && <span className="text-muted-foreground"> (você)</span>}
                  </p>
                  <p className="text-muted-foreground truncate text-xs">{p.email}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    <Badge variant={p.papel === "admin" ? "default" : "secondary"}>
                      {ROTULO_PAPEL[p.papel]}
                    </Badge>
                    <Badge variant="outline">{ROTULO_REGIAO_PESSOA[p.regiao]}</Badge>
                    {situacao(p)}
                  </div>
                </div>
                {acoes(p)}
              </li>
            ))}
          </ul>

          {/* Desktop: tabela */}
          <div className="hidden rounded-xl border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Região</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead className="w-12">
                    <span className="sr-only">Ações</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.map((p) => (
                  <TableRow key={p.id} className={p.ativo ? undefined : "text-muted-foreground"}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <AvatarPessoa
                          nome={p.nome}
                          iniciais={p.iniciais}
                          regiao={p.regiao}
                          ativo={p.ativo}
                        />
                        <div className="min-w-0">
                          <p className="font-medium">
                            {p.nome}
                            {p.id === meuId && (
                              <span className="text-muted-foreground"> (você)</span>
                            )}
                          </p>
                          <p className="text-muted-foreground text-xs">{p.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{ROTULO_REGIAO_PESSOA[p.regiao]}</TableCell>
                    <TableCell>
                      <Badge variant={p.papel === "admin" ? "default" : "secondary"}>
                        {ROTULO_PAPEL[p.papel]}
                      </Badge>
                    </TableCell>
                    <TableCell>{situacao(p)}</TableCell>
                    <TableCell>{acoes(p)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <DialogUsuario
        aberto={aberto?.tipo === "criar" || aberto?.tipo === "editar"}
        perfil={aberto?.tipo === "editar" ? aberto.perfil : undefined}
        eMeuPerfil={aberto?.tipo === "editar" && aberto.perfil.id === meuId}
        aoFechar={fechar}
      />
      <DialogRedefinirSenha
        perfil={aberto?.tipo === "senha" ? aberto.perfil : undefined}
        aoFechar={fechar}
      />

      <AlertDialog open={aberto?.tipo === "ativo"} onOpenChange={(o) => !o && fechar()}>
        {aberto?.tipo === "ativo" && (
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {aberto.perfil.ativo
                  ? `Desativar ${aberto.perfil.nome}?`
                  : `Reativar ${aberto.perfil.nome}?`}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {aberto.perfil.ativo
                  ? "A pessoa não conseguirá mais entrar. As atribuições dela continuam nos itens e podem ser trocadas a qualquer momento."
                  : "A pessoa poderá entrar de novo com a senha que já tinha."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={pendente}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                variant={aberto.perfil.ativo ? "destructive" : "default"}
                disabled={pendente}
                onClick={(e) => {
                  e.preventDefault();
                  confirmarAtivo(aberto.perfil);
                }}
              >
                {aberto.perfil.ativo ? "Desativar" : "Reativar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </AlertDialog>
    </div>
  );
}
