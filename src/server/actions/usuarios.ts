"use server";

import { revalidatePath } from "next/cache";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { criarClienteServidor } from "@/lib/supabase/server";
import { errosDeCampo, traduzirErro, traduzirErroAdmin } from "@/lib/erros";
import {
  criarUsuarioSchema,
  dadosDoForm,
  editarUsuarioSchema,
  gerarIniciais,
  idSchema,
  redefinirSenhaSchema,
} from "@/lib/validacao/usuarios";
import { falha, sucesso, type Resultado } from "@/server/resultado";
import { obterPerfilAtual, type Perfil } from "@/server/sessao";

// Ban "permanente" do Supabase Auth (~100 anos).
const BAN_DESATIVADO = "876000h";

/** Confirma no banco que quem chama é admin ativo. */
async function admin(): Promise<Perfil | null> {
  const perfil = await obterPerfilAtual();
  return perfil?.papel === "admin" ? perfil : null;
}

const SEM_PERMISSAO = "Apenas administradores podem gerenciar usuários.";

export async function criarUsuario(_: Resultado | null, form: FormData): Promise<Resultado> {
  if (!(await admin())) return falha(SEM_PERMISSAO);

  const parsed = criarUsuarioSchema.safeParse(dadosDoForm(form));
  if (!parsed.success) return falha("Confira os campos.", errosDeCampo(parsed.error));
  const d = parsed.data;

  const adminDb = criarClienteAdmin();
  const { data, error } = await adminDb.auth.admin.createUser({
    email: d.email,
    password: d.senha,
    email_confirm: true,
    user_metadata: { nome: d.nome },
  });
  if (error) {
    console.error("[admin] Auth:", error.status, error.message);
    const msg = traduzirErroAdmin(error);
    return falha(msg, /e-mail/.test(msg) ? { email: msg } : undefined);
  }

  const { error: erroPerfil } = await adminDb.from("perfis").insert({
    id: data.user.id,
    nome: d.nome,
    email: d.email,
    iniciais: gerarIniciais(d.nome),
    regiao: d.regiao,
    papel: d.papel,
    precisa_trocar_senha: true,
  });
  if (erroPerfil) {
    await adminDb.auth.admin.deleteUser(data.user.id);
    return falha(traduzirErro(erroPerfil));
  }

  revalidatePath("/admin/usuarios");
  return sucesso(
    undefined,
    `Conta de ${d.nome} criada. No primeiro acesso será pedida a troca de senha.`,
  );
}

export async function editarUsuario(_: Resultado | null, form: FormData): Promise<Resultado> {
  if (!(await admin())) return falha(SEM_PERMISSAO);

  const parsed = editarUsuarioSchema.safeParse(dadosDoForm(form));
  if (!parsed.success) return falha("Confira os campos.", errosDeCampo(parsed.error));
  const d = parsed.data;

  const supabase = await criarClienteServidor();
  const { data: atual } = await supabase
    .from("perfis")
    .select("email")
    .eq("id", d.id)
    .maybeSingle();
  if (!atual) return falha("Usuário não encontrado.");

  if (atual.email !== d.email) {
    const { error } = await criarClienteAdmin().auth.admin.updateUserById(d.id, {
      email: d.email,
      email_confirm: true,
    });
    if (error) {
      const msg = traduzirErroAdmin(error);
      return falha(msg, /e-mail/.test(msg) ? { email: msg } : undefined);
    }
  }

  // Cliente do usuário: o RLS e os triggers validam (ex.: admin não se rebaixa).
  const { error } = await supabase
    .from("perfis")
    .update({
      nome: d.nome,
      email: d.email,
      iniciais: gerarIniciais(d.nome),
      regiao: d.regiao,
      papel: d.papel,
    })
    .eq("id", d.id);
  if (error) return falha(traduzirErro(error));

  revalidatePath("/admin/usuarios");
  return sucesso(undefined, "Dados atualizados.");
}

export async function alterarAtivo(id: string, ativo: boolean): Promise<Resultado> {
  if (!(await admin())) return falha(SEM_PERMISSAO);
  if (!idSchema.safeParse({ id }).success) return falha("Usuário inválido.");

  const supabase = await criarClienteServidor();
  const { error } = await supabase.from("perfis").update({ ativo }).eq("id", id);
  if (error) return falha(traduzirErro(error));

  // Bane/desbane no Auth para impedir novos logins e renovação de sessão.
  const { error: erroAuth } = await criarClienteAdmin().auth.admin.updateUserById(id, {
    ban_duration: ativo ? "none" : BAN_DESATIVADO,
  });
  if (erroAuth) {
    await supabase.from("perfis").update({ ativo: !ativo }).eq("id", id);
    console.error("[admin] Auth:", erroAuth.status, erroAuth.message);
    return falha(traduzirErroAdmin(erroAuth));
  }

  revalidatePath("/admin/usuarios");
  return sucesso(undefined, ativo ? "Conta reativada." : "Conta desativada.");
}

export async function redefinirSenha(_: Resultado | null, form: FormData): Promise<Resultado> {
  if (!(await admin())) return falha(SEM_PERMISSAO);

  const parsed = redefinirSenhaSchema.safeParse(dadosDoForm(form));
  if (!parsed.success) return falha("Confira os campos.", errosDeCampo(parsed.error));

  const { error } = await criarClienteAdmin().auth.admin.updateUserById(parsed.data.id, {
    password: parsed.data.senha,
  });
  if (error) {
    console.error("[admin] Auth:", error.status, error.message);
    const msg = traduzirErroAdmin(error);
    return falha(msg, { senha: msg });
  }

  const supabase = await criarClienteServidor();
  const { error: erroPerfil } = await supabase
    .from("perfis")
    .update({ precisa_trocar_senha: true })
    .eq("id", parsed.data.id);
  if (erroPerfil) return falha(traduzirErro(erroPerfil));

  revalidatePath("/admin/usuarios");
  return sucesso(undefined, "Senha redefinida. No próximo acesso será pedida a troca.");
}
