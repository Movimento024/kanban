import type { ZodError } from "zod";

/** Traduz mensagens do Supabase/Postgres para português, sem jargão técnico. */
export function traduzirErro(erro: { message?: string; code?: string } | null | undefined): string {
  const msg = erro?.message ?? "";
  const code = erro?.code ?? "";

  if (/invalid login credentials/i.test(msg)) return "E-mail ou senha incorretos.";
  if (/user is banned/i.test(msg)) return "Esta conta está desativada. Fale com um administrador.";
  if (/should be different from the old password/i.test(msg))
    return "A nova senha precisa ser diferente da atual.";
  if (/password should be at least/i.test(msg))
    return "A senha precisa ter pelo menos 8 caracteres.";
  if (/weak password|password is known to be weak/i.test(msg))
    return "Essa senha é muito fraca. Escolha outra.";
  if (
    /already been registered|already registered|email_exists/i.test(msg) ||
    code === "email_exists"
  )
    return "Já existe uma conta com este e-mail.";
  if (/rate limit|too many requests/i.test(msg))
    return "Muitas tentativas seguidas. Aguarde um pouco e tente de novo.";
  if (/fetch failed|network|ECONNREFUSED/i.test(msg))
    return "Não foi possível conectar ao servidor. Verifique sua internet.";
  // Postgres: mensagens dos nossos triggers já vêm em português
  if (code === "42501" || code === "23514") return msg || "Você não tem permissão para isso.";
  if (code === "23505") return "Já existe um registro com esses dados.";
  if (code === "23503")
    return "Não dá para excluir porque está em uso (por exemplo, é a opção escolhida de uma decisão).";
  return "Algo deu errado. Tente de novo em instantes.";
}

/**
 * Erros da Admin API do Auth (criar/editar contas). 401/403 aqui quer dizer que a
 * chave secreta do servidor está ausente ou errada — não é culpa de quem usa.
 */
export function traduzirErroAdmin(
  erro: { message?: string; code?: string; status?: number } | null | undefined,
): string {
  if (erro?.status === 401 || erro?.status === 403 || /invalid api key/i.test(erro?.message ?? ""))
    return "O servidor não está autorizado a gerenciar contas. Confira a chave secreta (SUPABASE_SECRET_KEY) na Vercel.";
  return traduzirErro(erro);
}

/** Converte um erro do Zod em { campo: mensagem } (primeira mensagem de cada campo). */
export function errosDeCampo(erro: ZodError): Record<string, string> {
  const campos: Record<string, string> = {};
  for (const issue of erro.issues) {
    const chave = issue.path.join(".");
    if (chave && !campos[chave]) campos[chave] = issue.message;
  }
  return campos;
}
