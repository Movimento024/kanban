import { z } from "zod";
import { LAYOUTS } from "@/lib/constantes";
import { ICONES_FRENTE, LISTA_CORES } from "@/lib/frentes";

export const frenteSchema = z.object({
  nome: z
    .string({ error: "Informe o nome." })
    .trim()
    .min(2, "Informe o nome da frente.")
    .max(40, "Nome muito longo (máx. 40)."),
  descricao: z
    .string()
    .trim()
    .max(200, "Descrição muito longa (máx. 200).")
    .transform((v) => v || null)
    .optional(),
  cor: z.enum(LISTA_CORES, { error: "Escolha uma cor." }),
  icone: z.enum(ICONES_FRENTE, { error: "Escolha um ícone." }),
  layout: z.enum(LAYOUTS, { error: "Escolha o tipo de visualização." }),
});

export const editarFrenteSchema = frenteSchema.extend({ id: z.guid() });

export const idsSchema = z.array(z.guid()).min(1).max(200);

export const excluirFrenteSchema = z.discriminatedUnion("modo", [
  z.object({ id: z.guid(), modo: z.literal("vazia") }),
  z.object({
    id: z.guid(),
    modo: z.literal("mover"),
    destino: z.guid({ error: "Escolha a frente que vai receber os itens." }),
  }),
  z.object({ id: z.guid(), modo: z.literal("excluir_itens"), confirmacao: z.string() }),
]);
