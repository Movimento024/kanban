import { Suspense } from "react";
import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AvatarPessoa } from "@/components/comum/avatar-pessoa";
import { FormTrocarSenha } from "@/components/conta/form-trocar-senha";
import { ROTULO_PAPEL, ROTULO_REGIAO_PESSOA } from "@/lib/constantes";
import { exigirPerfil } from "@/server/sessao";

export const metadata: Metadata = { title: "Minha conta · Movimento 024" };

async function MeusDados() {
  const perfil = await exigirPerfil();
  const linhas = [
    ["Nome", perfil.nome],
    ["E-mail", perfil.email],
    ["Região", ROTULO_REGIAO_PESSOA[perfil.regiao]],
    ["Papel", ROTULO_PAPEL[perfil.papel]],
  ];
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <AvatarPessoa
            nome={perfil.nome}
            iniciais={perfil.iniciais}
            regiao={perfil.regiao}
            tamanho="lg"
          />
          <div className="grid gap-1">
            <CardTitle>{perfil.nome}</CardTitle>
            <CardDescription>Para mudar seus dados, fale com um administrador.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-3 text-sm sm:grid-cols-[8rem_1fr]">
          {linhas.map(([rotulo, valor]) => (
            <div key={rotulo} className="contents">
              <dt className="text-muted-foreground">{rotulo}</dt>
              <dd className="-mt-2 font-medium break-all sm:mt-0">{valor}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

export default function PaginaConta() {
  return (
    <div className="mx-auto grid w-full max-w-xl gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Minha conta</h1>
      <Suspense fallback={<Skeleton className="h-56 w-full rounded-xl" />}>
        <MeusDados />
      </Suspense>
      <Card>
        <CardHeader>
          <CardTitle>Trocar senha</CardTitle>
        </CardHeader>
        <CardContent>
          <FormTrocarSenha />
        </CardContent>
      </Card>
    </div>
  );
}
