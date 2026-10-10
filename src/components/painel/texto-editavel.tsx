"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Texto que vira campo ao clicar. Enter salva (Shift+Enter quebra linha no
 * modo multilinha), Esc cancela, sair do campo salva.
 * Classes nodrag/nopan/nowheel: necessárias dentro do mapa mental (React Flow).
 */
export function TextoEditavel({
  valor,
  aoSalvar,
  rotulo,
  multilinha = false,
  desabilitado = false,
  className,
  classeTexto,
  maxLength = 300,
}: {
  valor: string;
  aoSalvar: (novo: string) => Promise<boolean> | void;
  rotulo: string;
  multilinha?: boolean;
  desabilitado?: boolean;
  className?: string;
  classeTexto?: string;
  maxLength?: number;
}) {
  const [editando, setEditando] = useState(false);
  const [rascunho, setRascunho] = useState(valor);
  const campo = useRef<HTMLInputElement & HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editando) campo.current?.select();
  }, [editando]);

  function comecar() {
    if (desabilitado) return;
    setRascunho(valor);
    setEditando(true);
  }

  async function salvar() {
    const novo = rascunho.trim();
    setEditando(false);
    if (novo && novo !== valor) await aoSalvar(novo);
  }

  if (!editando) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          comecar();
        }}
        disabled={desabilitado}
        aria-label={`${rotulo}: ${valor}. Clique para editar`}
        className={cn(
          "nodrag nopan hover:bg-muted/70 focus-visible:ring-ring min-w-0 cursor-text rounded-sm text-left focus-visible:ring-2 focus-visible:outline-none disabled:cursor-default disabled:hover:bg-transparent",
          multilinha ? "whitespace-pre-wrap" : "truncate",
          classeTexto,
          className,
        )}
      >
        {valor}
      </button>
    );
  }

  const comum = {
    ref: campo,
    value: rascunho,
    maxLength,
    "aria-label": rotulo,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setRascunho(e.target.value),
    onBlur: salvar,
    onClick: (e: React.MouseEvent) => e.stopPropagation(),
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setEditando(false);
      } else if (e.key === "Enter" && !(multilinha && e.shiftKey)) {
        e.preventDefault();
        void salvar();
      }
    },
    autoFocus: true,
    className: cn(
      "nodrag nopan nowheel w-full min-w-0 rounded-sm border bg-background px-1 outline-none focus-visible:ring-2 focus-visible:ring-ring",
      classeTexto,
      className,
    ),
  };

  return multilinha ? <textarea rows={3} {...comum} /> : <input {...comum} />;
}

/**
 * Campo para adicionar um filho (tarefa, opção, nota...). Enter adiciona e
 * limpa para o próximo; Esc (ou ×) fecha. Não fecha ao perder o foco: dentro do
 * mapa mental o React Flow pega o foco de volta após o clique.
 */
export function NovoFilho({
  rotulo,
  placeholder,
  aoAdicionar,
  aoFechar,
  multilinha = false,
  className,
}: {
  rotulo: string;
  placeholder: string;
  aoAdicionar: (texto: string) => Promise<boolean>;
  aoFechar?: () => void;
  multilinha?: boolean;
  className?: string;
}) {
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const campo = useRef<HTMLInputElement & HTMLTextAreaElement>(null);

  // Foca ao aparecer. No mapa mental o nó nasce invisível até ser medido, e o foco
  // só "pega" depois disso: tenta por até ~1 s.
  const querFoco = !!aoFechar;
  useEffect(() => {
    if (!querFoco) return;
    let tentativas = 0;
    const t = setInterval(() => {
      const el = campo.current;
      if (el) el.focus();
      if (!el || document.activeElement === el || ++tentativas > 20) clearInterval(t);
    }, 50);
    return () => clearInterval(t);
  }, [querFoco]);

  async function adicionar() {
    const t = texto.trim();
    if (!t || enviando) return;
    setEnviando(true);
    const ok = await aoAdicionar(t);
    setEnviando(false);
    if (ok) setTexto("");
    campo.current?.focus();
  }

  const props = {
    ref: campo,
    value: texto,
    placeholder,
    "aria-label": rotulo,
    // readOnly (e não disabled) para não perder o foco enquanto salva.
    readOnly: enviando,
    "aria-busy": enviando || undefined,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setTexto(e.target.value),
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Escape") aoFechar?.();
      else if (e.key === "Enter" && !(multilinha && e.shiftKey)) {
        e.preventDefault();
        void adicionar();
      }
    },
    className:
      "nodrag nopan nowheel min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground",
  };

  return (
    <div
      className={cn(
        "focus-within:ring-ring flex items-start gap-1.5 rounded-md border border-dashed px-2 py-1.5 focus-within:border-solid focus-within:ring-2",
        className,
      )}
    >
      <Plus className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden />
      {multilinha ? <textarea rows={2} {...props} /> : <input {...props} />}
      {aoFechar && (
        <button
          type="button"
          onClick={aoFechar}
          aria-label="Fechar"
          className="nodrag nopan text-muted-foreground hover:text-foreground focus-visible:ring-ring shrink-0 rounded focus-visible:ring-2 focus-visible:outline-none"
        >
          <X className="size-4" aria-hidden />
        </button>
      )}
    </div>
  );
}
