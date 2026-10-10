/**
 * Paleta e ícones permitidos para frentes. Lista fechada para garantir
 * contraste nos temas claro e escuro (e o Tailwind enxergar as classes).
 * Violeta, índigo e verde-azulado ficam de fora: são as cores de região.
 */
export const CORES_FRENTE = {
  fuchsia: {
    nome: "Fúcsia",
    ponto: "bg-fuchsia-500",
    suave: "bg-fuchsia-500/12 text-fuchsia-800 dark:text-fuchsia-300",
    borda: "border-fuchsia-500",
  },
  pink: {
    nome: "Rosa",
    ponto: "bg-pink-500",
    suave: "bg-pink-500/12 text-pink-800 dark:text-pink-300",
    borda: "border-pink-500",
  },
  rose: {
    nome: "Framboesa",
    ponto: "bg-rose-500",
    suave: "bg-rose-500/12 text-rose-800 dark:text-rose-300",
    borda: "border-rose-500",
  },
  orange: {
    nome: "Laranja",
    ponto: "bg-orange-500",
    suave: "bg-orange-500/12 text-orange-800 dark:text-orange-300",
    borda: "border-orange-500",
  },
  amber: {
    nome: "Âmbar",
    ponto: "bg-amber-500",
    suave: "bg-amber-500/12 text-amber-800 dark:text-amber-300",
    borda: "border-amber-500",
  },
  lime: {
    nome: "Lima",
    ponto: "bg-lime-500",
    suave: "bg-lime-500/12 text-lime-800 dark:text-lime-300",
    borda: "border-lime-500",
  },
  emerald: {
    nome: "Esmeralda",
    ponto: "bg-emerald-500",
    suave: "bg-emerald-500/12 text-emerald-800 dark:text-emerald-300",
    borda: "border-emerald-500",
  },
  cyan: {
    nome: "Ciano",
    ponto: "bg-cyan-500",
    suave: "bg-cyan-500/12 text-cyan-800 dark:text-cyan-300",
    borda: "border-cyan-500",
  },
  sky: {
    nome: "Céu",
    ponto: "bg-sky-500",
    suave: "bg-sky-500/12 text-sky-800 dark:text-sky-300",
    borda: "border-sky-500",
  },
  blue: {
    nome: "Azul",
    ponto: "bg-blue-500",
    suave: "bg-blue-500/12 text-blue-800 dark:text-blue-300",
    borda: "border-blue-500",
  },
  slate: {
    nome: "Grafite",
    ponto: "bg-slate-500",
    suave: "bg-slate-500/12 text-slate-800 dark:text-slate-300",
    borda: "border-slate-500",
  },
} as const;

export type CorFrente = keyof typeof CORES_FRENTE;
export const LISTA_CORES = Object.keys(CORES_FRENTE) as CorFrente[];

export function corFrente(cor: string) {
  return CORES_FRENTE[cor as CorFrente] ?? CORES_FRENTE.slate;
}

/** Nomes de ícones lucide permitidos (o componente IconeFrente faz o mapeamento). */
export const ICONES_FRENTE = [
  "calendar-days",
  "hand-heart",
  "radio",
  "store",
  "megaphone",
  "music",
  "book-open",
  "users",
  "heart",
  "star",
  "flag",
  "map-pin",
  "plane",
  "tent",
  "mic",
  "video",
  "camera",
  "gift",
  "church",
  "sparkles",
] as const;

export type IconeFrente = (typeof ICONES_FRENTE)[number];
