import { z } from "zod";
import { PAPEIS, REGIOES_PESSOA, SENHA_MINIMA } from "@/lib/constantes";

export const senhaSchema = z
  .string({ error: "Informe a senha." })
  .min(SENHA_MINIMA, `A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.`)
  .max(72, "A senha pode ter no máximo 72 caracteres.");

const nome = z
  .string({ error: "Informe o nome." })
  .trim()
  .min(2, "Informe o nome completo.")
  .max(80, "Nome muito longo.");

const email = z
  .string({ error: "Informe o e-mail." })
  .trim()
  .toLowerCase()
  .pipe(z.email("E-mail inválido."));

const regiao = z.enum(REGIOES_PESSOA, { error: "Escolha a região." });
const papel = z.enum(PAPEIS, { error: "Escolha o papel." });

export const loginSchema = z.object({
  email,
  senha: z.string({ error: "Informe a senha." }).min(1, "Informe a senha."),
});

export const novaSenhaSchema = z
  .object({ senha: senhaSchema, confirmacao: z.string() })
  .refine((d) => d.senha === d.confirmacao, {
    path: ["confirmacao"],
    message: "As senhas não conferem.",
  });

export const trocarSenhaSchema = z
  .object({
    senha_atual: z.string().min(1, "Informe a senha atual."),
    senha: senhaSchema,
    confirmacao: z.string(),
  })
  .refine((d) => d.senha === d.confirmacao, {
    path: ["confirmacao"],
    message: "As senhas não conferem.",
  });

export const criarUsuarioSchema = z.object({
  nome,
  email,
  regiao,
  papel,
  senha: senhaSchema,
});

export const editarUsuarioSchema = z.object({
  id: z.uuid(),
  nome,
  email,
  regiao,
  papel,
});

export const redefinirSenhaSchema = z.object({ id: z.uuid(), senha: senhaSchema });

export const idSchema = z.object({ id: z.uuid() });

/** "Andréa de Aquino" → "AA" */
export function gerarIniciais(nomeCompleto: string) {
  const partes = nomeCompleto.trim().split(/\s+/);
  const primeira = partes[0]?.[0] ?? "";
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (primeira + ultima).toUpperCase();
}

/** FormData → objeto simples para o Zod. */
export function dadosDoForm(form: FormData) {
  return Object.fromEntries(form.entries());
}
