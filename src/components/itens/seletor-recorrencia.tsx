"use client";

import { useState } from "react";
import { Plus, Repeat, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatarDiaCurto } from "@/lib/datas";
import {
  CANAIS_SUGERIDOS,
  DIAS_SEMANA,
  ORDEM_SEMANA,
  RECORRENCIAS,
  ROTULO_RECORRENCIA,
  descreverCadencia,
  distanciaEmDias,
  proximaOcorrencia,
  type Recorrencia,
} from "@/lib/recorrencia";
import { cn } from "@/lib/utils";

export type ValorRecorrencia = {
  recorrencia: Recorrencia;
  dia: string;
  estreia: string;
  texto: string;
  canais: string[];
};

export const RECORRENCIA_VAZIA: ValorRecorrencia = {
  recorrencia: "nenhuma",
  dia: "",
  estreia: "",
  texto: "",
  canais: [],
};

const classeCampo = "h-10 w-full md:h-9";

/** Inputs escondidos: mantêm a recorrência ao salvar quando a seção não aparece. */
export function RecorrenciaOculta({ valor }: { valor: ValorRecorrencia }) {
  return (
    <>
      <input type="hidden" name="recorrencia" value={valor.recorrencia} />
      <input type="hidden" name="recorrencia_dia_semana" value={valor.dia} />
      <input type="hidden" name="recorrencia_estreia" value={valor.estreia} />
      <input type="hidden" name="recorrencia_texto" value={valor.texto} />
      <input type="hidden" name="canais" value={valor.canais.join(",")} />
    </>
  );
}

/** Recorrência e canais do item (layout Cadência). */
export function SeletorRecorrencia({
  valor,
  aoMudar,
  erros,
}: {
  valor: ValorRecorrencia;
  aoMudar: (v: ValorRecorrencia) => void;
  erros?: Record<string, string>;
}) {
  const [novoCanal, setNovoCanal] = useState("");
  const set = <K extends keyof ValorRecorrencia>(k: K, v: ValorRecorrencia[K]) =>
    aoMudar({ ...valor, [k]: v });
  const erro = (k: string) => erros?.[k] && <p className="text-destructive text-xs">{erros[k]}</p>;

  const dados = {
    recorrencia: valor.recorrencia,
    recorrencia_dia_semana: valor.dia ? Number(valor.dia) : null,
    recorrencia_estreia: valor.estreia || null,
  };
  const cadencia = descreverCadencia(dados);
  const proxima = proximaOcorrencia(dados);

  function adicionarCanal(nome: string) {
    const c = nome.trim().replace(/,/g, "");
    if (!c || valor.canais.some((x) => x.toLowerCase() === c.toLowerCase())) return;
    set("canais", [...valor.canais, c]);
  }

  const sugestoes = CANAIS_SUGERIDOS.filter((c) => !valor.canais.includes(c));
  const pedeDia = valor.recorrencia === "semanal";
  const pedeEstreia = valor.recorrencia !== "nenhuma";

  return (
    <fieldset className="grid gap-3 rounded-lg border p-3">
      <legend className="flex items-center gap-1.5 px-1 text-sm font-medium">
        <Repeat className="size-4" aria-hidden /> Recorrência e canais
      </legend>
      <input type="hidden" name="canais" value={valor.canais.join(",")} />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="grid gap-1.5">
          <Label htmlFor="item-recorrencia">Frequência</Label>
          <Select
            name="recorrencia"
            value={valor.recorrencia}
            onValueChange={(v) => set("recorrencia", v as Recorrencia)}
          >
            <SelectTrigger id="item-recorrencia" className={classeCampo}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RECORRENCIAS.map((r) => (
                <SelectItem key={r} value={r}>
                  {ROTULO_RECORRENCIA[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {pedeDia && (
          <div className="grid gap-1.5">
            <Label htmlFor="item-dia-semana">Dia da semana</Label>
            <Select
              name="recorrencia_dia_semana"
              value={valor.dia}
              onValueChange={(v) => set("dia", v)}
            >
              <SelectTrigger
                id="item-dia-semana"
                className={classeCampo}
                aria-invalid={!!erros?.recorrencia_dia_semana || undefined}
              >
                <SelectValue placeholder="Escolha" />
              </SelectTrigger>
              <SelectContent>
                {ORDEM_SEMANA.map((d) => (
                  <SelectItem key={d} value={String(d)}>
                    {DIAS_SEMANA[d].charAt(0).toUpperCase() + DIAS_SEMANA[d].slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {erro("recorrencia_dia_semana")}
          </div>
        )}

        {pedeEstreia && (
          <div className="grid gap-1.5">
            <Label htmlFor="item-estreia">
              Estreia
              {pedeDia && <span className="text-muted-foreground font-normal"> (opcional)</span>}
            </Label>
            <Input
              id="item-estreia"
              name="recorrencia_estreia"
              type="date"
              className={classeCampo}
              value={valor.estreia}
              onChange={(e) => set("estreia", e.target.value)}
              aria-invalid={!!erros?.recorrencia_estreia || undefined}
            />
            {erro("recorrencia_estreia")}
          </div>
        )}
      </div>

      {cadencia && (
        <p className="text-muted-foreground text-xs">
          Vai aparecer como <strong className="text-foreground">{cadencia}</strong>
          {proxima && (
            <>
              {" "}
              · próxima: {formatarDiaCurto(proxima)} ({distanciaEmDias(proxima)})
            </>
          )}
          .
        </p>
      )}

      <div className="grid gap-1.5">
        <Label htmlFor="item-recorrencia-texto">
          Observação da cadência{" "}
          <span className="text-muted-foreground font-normal">(opcional)</span>
        </Label>
        <Input
          id="item-recorrencia-texto"
          name="recorrencia_texto"
          className={classeCampo}
          maxLength={80}
          placeholder="Ex.: a definir, conforme eventos"
          value={valor.texto}
          onChange={(e) => set("texto", e.target.value)}
          aria-invalid={!!erros?.recorrencia_texto || undefined}
        />
        {erro("recorrencia_texto")}
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="item-novo-canal">Canais</Label>
        {valor.canais.length > 0 && (
          <ul className="flex flex-wrap gap-1.5" aria-label="Canais escolhidos">
            {valor.canais.map((c) => (
              <li
                key={c}
                className="bg-secondary flex items-center gap-1 rounded-full py-0.5 pr-1 pl-2.5 text-xs font-medium"
              >
                {c}
                <button
                  type="button"
                  onClick={() =>
                    set(
                      "canais",
                      valor.canais.filter((x) => x !== c),
                    )
                  }
                  aria-label={`Tirar ${c}`}
                  className="hover:bg-background focus-visible:ring-ring rounded-full p-0.5 focus-visible:ring-2 focus-visible:outline-none"
                >
                  <X className="size-3" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-2">
          <Input
            id="item-novo-canal"
            className={cn(classeCampo, "flex-1")}
            maxLength={30}
            placeholder="Outro canal"
            value={novoCanal}
            onChange={(e) => setNovoCanal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                adicionarCanal(novoCanal);
                setNovoCanal("");
              }
            }}
          />
          <button
            type="button"
            onClick={() => {
              adicionarCanal(novoCanal);
              setNovoCanal("");
            }}
            disabled={!novoCanal.trim()}
            className="hover:bg-muted focus-visible:ring-ring flex h-10 items-center gap-1 rounded-md border px-3 text-sm font-medium focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50 md:h-9"
          >
            <Plus className="size-4" aria-hidden /> Adicionar
          </button>
        </div>
        {sugestoes.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {sugestoes.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => adicionarCanal(c)}
                className="text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-ring rounded-full border border-dashed px-2.5 py-0.5 text-xs focus-visible:ring-2 focus-visible:outline-none"
              >
                + {c}
              </button>
            ))}
          </div>
        )}
        {erro("canais")}
      </div>
    </fieldset>
  );
}
