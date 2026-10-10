"use client";

import { use, useActionState, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Campo } from "@/components/comum/campo";
import { MensagemErro } from "@/components/comum/mensagem-erro";
import { useErrosCampos } from "@/components/comum/use-erros-campos";
import { entrar } from "@/server/actions/auth";

const MOTIVOS: Record<string, string> = {
  inativo:
    "Sua conta está desativada ou sua sessão terminou. Entre de novo ou fale com um administrador.",
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export function FormLogin({ searchParams }: Props) {
  const params = use(searchParams);
  const proximo = typeof params.proximo === "string" ? params.proximo : "";
  const motivo = typeof params.motivo === "string" ? MOTIVOS[params.motivo] : undefined;
  const [estado, acao, pendente] = useActionState(entrar, null);
  // Controlado: o React limpa o formulário após a action, e o e-mail deve continuar lá.
  const [email, setEmail] = useState("");
  const [erros, limparErro] = useErrosCampos(estado);

  return (
    <form action={acao} onChange={limparErro} className="grid gap-4" noValidate>
      {!estado && motivo && <MensagemErro>{motivo}</MensagemErro>}
      {estado && !estado.ok && !estado.campos && <MensagemErro>{estado.erro}</MensagemErro>}
      <input type="hidden" name="proximo" value={proximo} />
      <Campo
        rotulo="E-mail"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        required
        autoFocus
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        erro={erros?.email}
      />
      <Campo
        rotulo="Senha"
        name="senha"
        type="password"
        autoComplete="current-password"
        required
        erro={erros?.senha}
      />
      <Button type="submit" size="lg" className="h-10" disabled={pendente}>
        {pendente && <Loader2 className="animate-spin" aria-hidden />}
        Entrar
      </Button>
      <p className="text-muted-foreground text-center text-xs">
        Esqueceu a senha? Peça para um administrador redefinir.
      </p>
    </form>
  );
}
