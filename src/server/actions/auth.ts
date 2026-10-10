"use server";

import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/server";
import { errosDeCampo, traduzirErro } from "@/lib/erros";
import { dadosDoForm, loginSchema, novaSenhaSchema } from "@/lib/validacao/usuarios";
import { falha, type Resultado } from "@/server/resultado";

/** Só aceita caminhos internos (evita redirecionar para outro site). */
function destinoSeguro(valor: FormDataEntryValue | null) {
  const s = typeof valor === "string" ? valor : "";
  return s.startsWith("/") && !s.startsWith("//") ? s : "/";
}

export async function entrar(_: Resultado | null, form: FormData): Promise<Resultado> {
  const parsed = loginSchema.safeParse(dadosDoForm(form));
  if (!parsed.success) return falha("Confira os campos.", errosDeCampo(parsed.error));

  const supabase = await criarClienteServidor();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.senha,
  });
  if (error) return falha(traduzirErro(error));

  const { data: perfil } = await supabase
    .from("perfis")
    .select("ativo, precisa_trocar_senha")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!perfil?.ativo) {
    await supabase.auth.signOut();
    return falha("Esta conta está desativada. Fale com um administrador.");
  }

  redirect(perfil.precisa_trocar_senha ? "/trocar-senha" : destinoSeguro(form.get("proximo")));
}

export async function sair() {
  const supabase = await criarClienteServidor();
  await supabase.auth.signOut();
  redirect("/login");
}

/** Troca obrigatória no primeiro acesso (o usuário acabou de entrar com a senha inicial). */
export async function definirNovaSenha(_: Resultado | null, form: FormData): Promise<Resultado> {
  const parsed = novaSenhaSchema.safeParse(dadosDoForm(form));
  if (!parsed.success) return falha("Confira os campos.", errosDeCampo(parsed.error));

  const supabase = await criarClienteServidor();
  const { data: claims } = await supabase.auth.getClaims();
  const id = claims?.claims.sub;
  if (!id) redirect("/login");

  const { error } = await supabase.auth.updateUser({ password: parsed.data.senha });
  if (error) return falha(traduzirErro(error), { senha: traduzirErro(error) });

  const { error: erroPerfil } = await supabase
    .from("perfis")
    .update({ precisa_trocar_senha: false })
    .eq("id", id);
  if (erroPerfil) return falha(traduzirErro(erroPerfil));

  // Emite um token novo, já sem a claim precisa_trocar_senha.
  await supabase.auth.refreshSession();
  redirect("/");
}
