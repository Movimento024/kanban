"use server";

import { criarClienteServidor } from "@/lib/supabase/server";
import { errosDeCampo, traduzirErro } from "@/lib/erros";
import { dadosDoForm, trocarSenhaSchema } from "@/lib/validacao/usuarios";
import { falha, sucesso, type Resultado } from "@/server/resultado";
import { obterPerfilAtual } from "@/server/sessao";

export async function trocarMinhaSenha(_: Resultado | null, form: FormData): Promise<Resultado> {
  const parsed = trocarSenhaSchema.safeParse(dadosDoForm(form));
  if (!parsed.success) return falha("Confira os campos.", errosDeCampo(parsed.error));

  const perfil = await obterPerfilAtual();
  if (!perfil) return falha("Sua sessão expirou. Entre de novo.");

  const supabase = await criarClienteServidor();

  // Confirma a senha atual antes de trocar.
  const { error: erroAtual } = await supabase.auth.signInWithPassword({
    email: perfil.email,
    password: parsed.data.senha_atual,
  });
  if (erroAtual) {
    return falha("Senha atual incorreta.", { senha_atual: "Senha atual incorreta." });
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.senha });
  if (error) return falha(traduzirErro(error), { senha: traduzirErro(error) });

  return sucesso(undefined, "Senha alterada.");
}
