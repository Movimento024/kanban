"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Campo } from "@/components/comum/campo";
import { MensagemErro } from "@/components/comum/mensagem-erro";
import { useErrosCampos } from "@/components/comum/use-erros-campos";
import { definirNovaSenha, sair } from "@/server/actions/auth";
import { SENHA_MINIMA } from "@/lib/constantes";

export function FormNovaSenha() {
  const [estado, acao, pendente] = useActionState(definirNovaSenha, null);
  const [erros, limparErro] = useErrosCampos(estado);

  return (
    <div className="grid gap-3">
      <form action={acao} onChange={limparErro} className="grid gap-4" noValidate>
        {estado && !estado.ok && !estado.campos && <MensagemErro>{estado.erro}</MensagemErro>}
        <Campo
          rotulo="Nova senha"
          name="senha"
          type="password"
          autoComplete="new-password"
          required
          minLength={SENHA_MINIMA}
          autoFocus
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
        <Button type="submit" size="lg" className="h-10" disabled={pendente}>
          {pendente && <Loader2 className="animate-spin" aria-hidden />}
          Salvar e continuar
        </Button>
      </form>
      <form action={sair}>
        <Button type="submit" variant="ghost" className="w-full">
          Sair
        </Button>
      </form>
    </div>
  );
}
