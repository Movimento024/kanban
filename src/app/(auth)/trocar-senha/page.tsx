import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormNovaSenha } from "@/components/auth/form-nova-senha";

export const metadata: Metadata = { title: "Criar sua senha · Movimento 024" };

export default function PaginaTrocarSenha() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Crie sua senha</CardTitle>
        <CardDescription>
          Este é seu primeiro acesso (ou sua senha foi redefinida). Escolha uma senha só sua para
          continuar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FormNovaSenha />
      </CardContent>
    </Card>
  );
}
