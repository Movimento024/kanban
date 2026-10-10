import { Suspense } from "react";
import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FormLogin } from "@/components/auth/form-login";

export const metadata: Metadata = { title: "Entrar · Movimento 024" };

export default function PaginaLogin({ searchParams }: PageProps<"/login">) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Entrar</CardTitle>
        <CardDescription>Use o e-mail e a senha que o administrador te passou.</CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<Skeleton className="h-52 w-full" />}>
          <FormLogin searchParams={searchParams} />
        </Suspense>
      </CardContent>
    </Card>
  );
}
