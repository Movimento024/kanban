"use client";

import { CalendarClock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  PERIODOS,
  PRECISOES,
  ROTULO_PERIODO,
  ROTULO_PRECISAO,
  anosDoPlanejamento,
  formatarDataItem,
  normalizarIntervalo,
  type PeriodoAno,
  type PrecisaoData,
} from "@/lib/datas";

export type ValorData = {
  precisao: PrecisaoData;
  dia: string;
  hora: string;
  horaFim: string;
  inicio: string;
  fim: string;
  mes: string;
  ano: string;
  periodo: PeriodoAno | "";
  texto: string;
};

export const DATA_VAZIA: ValorData = {
  precisao: "a_definir",
  dia: "",
  hora: "",
  horaFim: "",
  inicio: "",
  fim: "",
  mes: "",
  ano: "",
  periodo: "",
  texto: "",
};

/** Prévia da data como vai aparecer nos cards. */
function previa(v: ValorData): string | null {
  const iniciais: Record<PrecisaoData, string | null> = {
    a_definir: null,
    exata: v.dia || null,
    intervalo: v.inicio || null,
    mes: v.mes ? `${v.mes}-01` : null,
    periodo: v.ano ? `${v.ano}-01-01` : null,
  };
  const inicio = iniciais[v.precisao];
  if (v.precisao !== "a_definir" && !inicio) return null;
  if (v.precisao === "periodo" && !v.periodo) return null;
  const periodo = v.periodo || null;
  const comHorario = v.precisao === "exata" || v.precisao === "intervalo";
  const n = normalizarIntervalo(
    v.precisao,
    inicio,
    v.precisao === "intervalo" ? v.fim || null : null,
    periodo,
  );
  return formatarDataItem({
    data_precisao: v.precisao,
    data_inicio: n.inicio,
    data_fim: n.fim,
    data_hora: comHorario ? v.hora || null : null,
    data_hora_fim: comHorario && v.hora ? v.horaFim || null : null,
    data_periodo: periodo,
  });
}

const classeCampo = "h-10 md:h-9";

export function SeletorData({
  valor,
  aoMudar,
  erros,
}: {
  valor: ValorData;
  aoMudar: (v: ValorData) => void;
  erros?: Record<string, string>;
}) {
  const set = <K extends keyof ValorData>(k: K, v: ValorData[K]) => aoMudar({ ...valor, [k]: v });
  const erro = (k: string) => erros?.[k] && <p className="text-destructive text-xs">{erros[k]}</p>;
  const textoPrevia = previa(valor);
  const campoHora = (nome: string, rotulo: string, chave: "hora" | "horaFim") => (
    <div className="grid gap-1.5">
      <Label htmlFor={nome}>
        {rotulo} <span className="text-muted-foreground font-normal">(opcional)</span>
      </Label>
      <Input
        id={nome}
        name={nome}
        type="time"
        className={classeCampo}
        value={valor[chave]}
        disabled={chave === "horaFim" && !valor.hora}
        onChange={(e) => set(chave, e.target.value)}
        aria-invalid={!!erros?.[nome] || undefined}
      />
      {erro(nome)}
    </div>
  );

  return (
    <fieldset className="grid gap-3 rounded-lg border p-3">
      <legend className="px-1 text-sm font-medium">Data</legend>

      {/* Precisão: grupo de rádio com aparência de botões segmentados */}
      <div
        className="bg-muted grid grid-cols-5 gap-1 rounded-md p-1"
        role="radiogroup"
        aria-label="Precisão da data"
      >
        {PRECISOES.map((p) => (
          <label key={p} className="cursor-pointer">
            <input
              type="radio"
              name="data_precisao"
              value={p}
              checked={valor.precisao === p}
              onChange={() => set("precisao", p)}
              className="peer sr-only"
            />
            <span
              className={cn(
                "text-muted-foreground peer-focus-visible:ring-ring flex h-8 items-center justify-center rounded px-1 text-center text-xs font-medium peer-focus-visible:ring-2 sm:text-sm",
                valor.precisao === p && "bg-background text-foreground shadow-sm",
              )}
            >
              {ROTULO_PRECISAO[p]}
            </span>
          </label>
        ))}
      </div>

      {valor.precisao === "exata" && (
        <div className="grid gap-2">
          <div className="grid gap-1.5">
            <Label htmlFor="data_dia">Dia</Label>
            <Input
              id="data_dia"
              name="data_dia"
              type="date"
              className={classeCampo}
              value={valor.dia}
              onChange={(e) => set("dia", e.target.value)}
              aria-invalid={!!erros?.data_dia || undefined}
            />
            {erro("data_dia")}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {campoHora("data_hora", "Início", "hora")}
            {campoHora("data_hora_fim", "Término", "horaFim")}
          </div>
          <p className="text-muted-foreground text-xs">Sem horário, vale o dia inteiro.</p>
        </div>
      )}

      {valor.precisao === "intervalo" && (
        <div className="grid gap-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="grid gap-1.5">
              <Label htmlFor="data_inicio">Início</Label>
              <Input
                id="data_inicio"
                name="data_inicio"
                type="date"
                className={classeCampo}
                value={valor.inicio}
                onChange={(e) => set("inicio", e.target.value)}
                aria-invalid={!!erros?.data_inicio || undefined}
              />
              {erro("data_inicio")}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="data_fim">Fim</Label>
              <Input
                id="data_fim"
                name="data_fim"
                type="date"
                min={valor.inicio || undefined}
                className={classeCampo}
                value={valor.fim}
                onChange={(e) => set("fim", e.target.value)}
                aria-invalid={!!erros?.data_fim || undefined}
              />
              {erro("data_fim")}
            </div>
            {campoHora("data_hora", "Hora do início", "hora")}
            {campoHora("data_hora_fim", "Hora do fim", "horaFim")}
          </div>
          <p className="text-muted-foreground text-xs">Sem horário, vale o dia inteiro.</p>
        </div>
      )}

      {valor.precisao === "mes" && (
        <div className="grid gap-1.5">
          <Label htmlFor="data_mes">Mês</Label>
          <Input
            id="data_mes"
            name="data_mes"
            type="month"
            className={classeCampo}
            value={valor.mes}
            onChange={(e) => set("mes", e.target.value)}
            aria-invalid={!!erros?.data_mes || undefined}
          />
          {erro("data_mes")}
        </div>
      )}

      {valor.precisao === "periodo" && (
        <div className="grid grid-cols-[1fr_7rem] gap-2">
          <div className="grid gap-1.5">
            <Label htmlFor="data_periodo">Período</Label>
            <Select
              name="data_periodo"
              value={valor.periodo}
              onValueChange={(v) => set("periodo", v as PeriodoAno)}
            >
              <SelectTrigger
                id="data_periodo"
                className={cn(classeCampo, "w-full")}
                aria-invalid={!!erros?.data_periodo || undefined}
              >
                <SelectValue placeholder="Escolha" />
              </SelectTrigger>
              <SelectContent>
                {PERIODOS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {ROTULO_PERIODO[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {erro("data_periodo")}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="data_ano">Ano</Label>
            <Select name="data_ano" value={valor.ano} onValueChange={(v) => set("ano", v)}>
              <SelectTrigger
                id="data_ano"
                className={cn(classeCampo, "w-full")}
                aria-invalid={!!erros?.data_ano || undefined}
              >
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                {anosDoPlanejamento().map((a) => (
                  <SelectItem key={a} value={String(a)}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {erro("data_ano")}
          </div>
        </div>
      )}

      <div className="grid gap-1.5">
        <Label htmlFor="data_texto">
          Observação sobre a data{" "}
          <span className="text-muted-foreground font-normal">(opcional)</span>
        </Label>
        <Input
          id="data_texto"
          name="data_texto"
          maxLength={120}
          placeholder="Ex.: final de março / início de abril"
          className={classeCampo}
          value={valor.texto}
          onChange={(e) => set("texto", e.target.value)}
        />
      </div>

      {textoPrevia && (
        <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
          <CalendarClock className="size-3.5" aria-hidden />
          Vai aparecer como: <strong className="text-foreground font-medium">{textoPrevia}</strong>
          {valor.texto && <span>({valor.texto})</span>}
        </p>
      )}
    </fieldset>
  );
}
