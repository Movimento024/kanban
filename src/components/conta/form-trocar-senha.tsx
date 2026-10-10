"use client";

import { useActionState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Campo } from "@/components/comum/campo";
import { MensagemErro } from "@/components/comum/mensagem-erro";
import { useErrosCampos } from "@/components/comum/use-erros-campos";
import { trocarMinhaSenha } from "@/server/actions/conta";
import { SENHA_MINIMA } from "@/lib/constantes";

export function FormTrocarSenha() {
  const [estado, acao, pendente] = useActionState(trocarMinhaSenha, null);
  const [erros, limparErro] = useErrosCampos(estado);
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (estado?.ok) {
      toast.success(estado.mensagem ?? "Senha alterada.");
      form.current?.reset();
    }
  }, [estado]);

  return (
    <form ref={form} action={acao} onChange={limparErro} className="grid gap-4" noValidate>
      {estado && !estado.ok && !estado.campos && <MensagemErro>{estado.erro}</MensagemErro>}
      <Campo
        rotulo="Senha atual"
        name="senha_atual"
        type="password"
        autoComplete="current-password"
        required
        erro={erros?.senha_atual}
      />
      <Campo
        rotulo="Nova senha"
        name="senha"
        type="password"
        autoComplete="new-password"
        required
        minLength={SENHA_MINIMA}
        ajuda={`Pelo menos ${SENHA_MINIMA} caracteres.`}
        erro={erros?.senha}
      />
      <Campo
        rotulo="Repita a nova senha"
        name="confirmacao"
        type="password"
        autoComplete="new-password"
        required
        erro={erros?.confirmacao}
      />
      <Button type="submit" className="h-10 sm:w-fit" disabled={pendente}>
        {pendente && <Loader2 className="animate-spin" aria-hidden />}
        Trocar senha
      </Button>
    </form>
  );
}
