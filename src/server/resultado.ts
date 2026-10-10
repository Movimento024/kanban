/** Retorno padrão das server actions: nunca lançam para a UI. */
export type Resultado<T = undefined> =
  | { ok: true; data: T; mensagem?: string }
  | { ok: false; erro: string; campos?: Record<string, string> };

export function sucesso<T>(data: T, mensagem?: string): Resultado<T> {
  return { ok: true, data, mensagem };
}

export function falha(erro: string, campos?: Record<string, string>): Resultado<never> {
  return { ok: false, erro, campos };
}
