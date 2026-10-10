"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Campo } from "@/components/comum/campo";
import { MensagemErro } from "@/components/comum/mensagem-erro";
import { useErrosCampos } from "@/components/comum/use-erros-campos";
import { IconeFrente } from "@/components/frentes/icone-frente";
import { DESCRICAO_LAYOUT, LAYOUTS, ROTULO_LAYOUT, type LayoutFrente } from "@/lib/constantes";
import { CORES_FRENTE, ICONES_FRENTE, LISTA_CORES, corFrente } from "@/lib/frentes";
import { cn } from "@/lib/utils";
import { criarFrente, editarFrente } from "@/server/actions/frentes";
import type { Frente } from "@/server/consultas/frentes";

/** Miniatura esquemática de cada tipo de visualização. */
export function PreviaLayout({ layout, className }: { layout: LayoutFrente; className?: string }) {
  const barra = "rounded-sm bg-current opacity-60";
  return (
    <div
      aria-hidden
      className={cn(
        "bg-muted/50 text-foreground/70 h-14 w-full rounded-md border p-1.5",
        className,
      )}
    >
      {layout === "linha_do_tempo" && (
        <div className="grid h-full grid-rows-3 gap-1">
          {[
            ["ml-[5%] w-[30%]", "ml-[50%] w-[20%]"],
            ["ml-[20%] w-[45%] opacity-30"],
            ["ml-[10%] w-[15%]", "ml-[60%] w-[30%] opacity-30"],
          ].map((linha, i) => (
            <div key={i} className="relative border-b border-dashed border-current/20">
              {linha.map((c, j) => (
                <div key={j} className={cn(barra, "absolute top-0.5 h-2", c)} />
              ))}
            </div>
          ))}
        </div>
      )}
      {layout === "cadencia" && (
        <div className="grid h-full grid-cols-3 gap-1">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="rounded-sm border border-current/30 p-0.5">
              <div className={cn(barra, "h-1 w-3/4")} />
            </div>
          ))}
        </div>
      )}
      {layout === "lista" && (
        <div className="grid h-full grid-rows-4 gap-1">
          {["w-4/5", "w-3/5", "w-2/3", "w-1/2"].map((w, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className="size-1.5 rounded-full bg-current opacity-60" />
              <div className={cn(barra, "h-1", w)} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FormFrente({
  frente,
  aoFechar,
  aoSalvar,
}: {
  frente?: Frente;
  aoFechar: () => void;
  aoSalvar?: (id: string) => void;
}) {
  const [estado, acao, pendente] = useActionState(frente ? editarFrente : criarFrente, null);
  const [erros, limparErro] = useErrosCampos(estado);
  const [nome, setNome] = useState(frente?.nome ?? "");
  const [descricao, setDescricao] = useState(frente?.descricao ?? "");
  const [cor, setCor] = useState(frente?.cor ?? "fuchsia");
  const [icone, setIcone] = useState(frente?.icone ?? "sparkles");
  const [layout, setLayout] = useState<LayoutFrente>(frente?.layout ?? "lista");

  // Cada resultado é tratado uma única vez (o pai pode recriar os callbacks).
  const tratado = useRef<typeof estado>(null);
  useEffect(() => {
    if (estado?.ok && tratado.current !== estado) {
      tratado.current = estado;
      toast.success(estado.mensagem);
      aoFechar();
      aoSalvar?.(estado.data.id);
    }
  }, [estado, aoFechar, aoSalvar]);

  return (
    <form action={acao} onChange={limparErro} className="grid gap-5" noValidate>
      {estado && !estado.ok && !estado.campos && <MensagemErro>{estado.erro}</MensagemErro>}
      {frente && <input type="hidden" name="id" value={frente.id} />}

      <div className="flex items-end gap-3">
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg",
            corFrente(cor).suave,
          )}
          aria-hidden
        >
          <IconeFrente nome={icone} className="size-5" />
        </span>
        <Campo
          className="flex-1"
          rotulo="Nome"
          name="nome"
          required
          autoFocus
          maxLength={40}
          placeholder="Ex.: Eventos"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          erro={erros?.nome}
        />
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="campo-descricao">
          Descrição <span className="text-muted-foreground font-normal">(opcional)</span>
        </Label>
        <Textarea
          id="campo-descricao"
          name="descricao"
          rows={2}
          maxLength={200}
          placeholder="Uma frase sobre o que entra nesta frente"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />
        {erros?.descricao && <p className="text-destructive text-xs">{erros.descricao}</p>}
      </div>

      <fieldset className="grid gap-2">
        <legend className="mb-2 text-sm font-medium">Cor</legend>
        <div className="flex flex-wrap gap-2">
          {LISTA_CORES.map((c) => (
            <label key={c} className="relative cursor-pointer" title={CORES_FRENTE[c].nome}>
              <input
                type="radio"
                name="cor"
                value={c}
                checked={cor === c}
                onChange={() => setCor(c)}
                className="peer sr-only"
              />
              <span className="sr-only">{CORES_FRENTE[c].nome}</span>
              <span
                className={cn(
                  "ring-offset-background peer-focus-visible:ring-ring flex size-8 items-center justify-center rounded-full ring-offset-2 peer-focus-visible:ring-2",
                  CORES_FRENTE[c].ponto,
                )}
              >
                {cor === c && <Check className="size-4 text-white" aria-hidden />}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="grid gap-2">
        <legend className="mb-2 text-sm font-medium">Ícone</legend>
        <div className="grid grid-cols-10 gap-1">
          {ICONES_FRENTE.map((i) => (
            <label key={i} className="cursor-pointer" title={i}>
              <input
                type="radio"
                name="icone"
                value={i}
                checked={icone === i}
                onChange={() => setIcone(i)}
                className="peer sr-only"
              />
              <span className="sr-only">Ícone {i}</span>
              <span
                className={cn(
                  "text-muted-foreground hover:bg-muted peer-focus-visible:ring-ring flex aspect-square items-center justify-center rounded-md border border-transparent peer-focus-visible:ring-2",
                  icone === i && "border-foreground/40 bg-muted text-foreground",
                )}
              >
                <IconeFrente nome={i} className="size-4" />
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="grid gap-2">
        <legend className="mb-2 text-sm font-medium">Tipo de visualização</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {LAYOUTS.map((l) => (
            <label key={l} className="cursor-pointer">
              <input
                type="radio"
                name="layout"
                value={l}
                checked={layout === l}
                onChange={() => setLayout(l)}
                className="peer sr-only"
              />
              <span
                className={cn(
                  "hover:bg-muted/50 peer-focus-visible:ring-ring grid h-full gap-2 rounded-lg border p-2.5 transition-colors peer-focus-visible:ring-2",
                  layout === l && "border-foreground bg-muted/50",
                )}
              >
                <PreviaLayout layout={l} />
                <span className="text-sm font-medium">{ROTULO_LAYOUT[l]}</span>
                <span className="text-muted-foreground text-xs">{DESCRICAO_LAYOUT[l]}</span>
              </span>
            </label>
          ))}
        </div>
        {frente && frente.layout !== layout && (
          <p className="text-muted-foreground text-xs">
            Os itens continuam os mesmos; só muda a forma de exibir.
          </p>
        )}
      </fieldset>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={aoFechar} disabled={pendente}>
          Cancelar
        </Button>
        <Button type="submit" disabled={pendente}>
          {pendente && <Loader2 className="animate-spin" aria-hidden />}
          {frente ? "Salvar" : "Criar frente"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function DialogFrente({
  aberto,
  frente,
  aoFechar,
  aoSalvar,
}: {
  aberto: boolean;
  frente?: Frente;
  aoFechar: () => void;
  aoSalvar?: (id: string) => void;
}) {
  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && aoFechar()}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{frente ? `Editar ${frente.nome}` : "Nova frente"}</DialogTitle>
          <DialogDescription>
            Cada frente vira uma aba do painel. Dá para mudar tudo isso depois.
          </DialogDescription>
        </DialogHeader>
        {aberto && (
          <FormFrente
            key={frente?.id ?? "nova"}
            frente={frente}
            aoFechar={aoFechar}
            aoSalvar={aoSalvar}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
