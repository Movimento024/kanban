"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Campo } from "@/components/comum/campo";
import { MensagemErro } from "@/components/comum/mensagem-erro";
import { useErrosCampos } from "@/components/comum/use-erros-campos";
import { DATA_VAZIA, SeletorData, type ValorData } from "@/components/itens/seletor-data";
import {
  REGIOES_ITEM,
  ROTULO_REGIAO_ITEM,
  ROTULO_STATUS,
  STATUS,
  type RegiaoItem,
  type StatusItem,
} from "@/lib/constantes";
import { AcoesAdminItem } from "@/components/itens/acoes-admin-item";
import { criarItem, editarItem } from "@/server/actions/itens";
import type { Database } from "@/lib/supabase/database.types";
import type { Frente } from "@/server/consultas/frentes";

/** Campos do item que o formulário edita (ItemResumo e ItemCompleto servem). */
export type ItemEditavel = Pick<
  Database["public"]["Tables"]["itens"]["Row"],
  | "id"
  | "titulo"
  | "descricao"
  | "frente_id"
  | "regiao"
  | "local"
  | "status"
  | "data_precisao"
  | "data_inicio"
  | "data_fim"
  | "data_hora"
  | "data_periodo"
  | "data_texto"
>;

/** Valores iniciais para um item novo (ex.: clique numa raia da linha do tempo). */
export type PadraoItem = {
  frente_id?: string;
  regiao?: RegiaoItem;
  data?: Partial<ValorData>;
};

function dataDoItem(item: ItemEditavel): ValorData {
  const ini = item.data_inicio ?? "";
  return {
    ...DATA_VAZIA,
    precisao: item.data_precisao,
    texto: item.data_texto ?? "",
    dia: item.data_precisao === "exata" ? ini : "",
    hora: item.data_hora?.slice(0, 5) ?? "",
    inicio: item.data_precisao === "intervalo" ? ini : "",
    fim: item.data_precisao === "intervalo" ? (item.data_fim ?? "") : "",
    mes: item.data_precisao === "mes" ? ini.slice(0, 7) : "",
    ano: item.data_precisao === "periodo" ? ini.slice(0, 4) : "",
    periodo: item.data_periodo ?? "",
  };
}

const classeCampo = "h-10 w-full md:h-9";

/**
 * Formulário de item. No diálogo, fecha ao salvar; embutido no painel do item,
 * só salva (as ações de admin ficam no cabeçalho do painel).
 */
export function FormItem({
  item,
  padrao,
  frentes,
  eAdmin,
  aoFechar,
  aoSalvar,
  embutido = false,
}: {
  item?: ItemEditavel;
  padrao?: PadraoItem;
  frentes: Frente[];
  eAdmin: boolean;
  aoFechar: () => void;
  aoSalvar?: (id: string) => void;
  embutido?: boolean;
}) {
  const [estado, acao, pendente] = useActionState(item ? editarItem : criarItem, null);
  const [erros, limparErro] = useErrosCampos(estado);
  const [titulo, setTitulo] = useState(item?.titulo ?? "");
  const [descricao, setDescricao] = useState(item?.descricao ?? "");
  const [frenteId, setFrenteId] = useState(item?.frente_id ?? padrao?.frente_id ?? "");
  const [regiao, setRegiao] = useState<RegiaoItem | "">(item?.regiao ?? padrao?.regiao ?? "");
  const [local, setLocal] = useState(item?.local ?? "");
  const [status, setStatus] = useState<StatusItem>(item?.status ?? "ideia");
  const [data, setData] = useState<ValorData>(
    item ? dataDoItem(item) : { ...DATA_VAZIA, ...padrao?.data },
  );
  const tratado = useRef<typeof estado>(null);

  useEffect(() => {
    if (estado?.ok && tratado.current !== estado) {
      tratado.current = estado;
      toast.success(estado.mensagem);
      if (!embutido) aoFechar();
      aoSalvar?.(estado.data.id);
    }
  }, [estado, aoFechar, aoSalvar, embutido]);

  const ocupado = pendente;

  return (
    <form action={acao} onChange={limparErro} className="grid gap-4" noValidate>
      {estado && !estado.ok && !estado.campos && <MensagemErro>{estado.erro}</MensagemErro>}
      {item && <input type="hidden" name="id" value={item.id} />}

      <Campo
        rotulo="Título"
        name="titulo"
        required
        autoFocus={!item && !embutido}
        maxLength={120}
        placeholder="Ex.: Mov Day Petrolina"
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        erro={erros?.titulo}
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="grid gap-1.5">
          <Label htmlFor="item-frente">Frente</Label>
          <Select name="frente_id" value={frenteId} onValueChange={setFrenteId}>
            <SelectTrigger
              id="item-frente"
              className={classeCampo}
              aria-invalid={!!erros?.frente_id || undefined}
            >
              <SelectValue placeholder="Escolha" />
            </SelectTrigger>
            <SelectContent>
              {frentes.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {erros?.frente_id && <p className="text-destructive text-xs">{erros.frente_id}</p>}
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="item-regiao">Região</Label>
          <Select name="regiao" value={regiao} onValueChange={(v) => setRegiao(v as RegiaoItem)}>
            <SelectTrigger
              id="item-regiao"
              className={classeCampo}
              aria-invalid={!!erros?.regiao || undefined}
            >
              <SelectValue placeholder="Escolha" />
            </SelectTrigger>
            <SelectContent>
              {REGIOES_ITEM.map((r) => (
                <SelectItem key={r} value={r}>
                  {ROTULO_REGIAO_ITEM[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {erros?.regiao && <p className="text-destructive text-xs">{erros.regiao}</p>}
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="item-status">Status</Label>
          <Select name="status" value={status} onValueChange={(v) => setStatus(v as StatusItem)}>
            <SelectTrigger id="item-status" className={classeCampo}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS.map((s) => (
                <SelectItem key={s} value={s}>
                  {ROTULO_STATUS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Campo
        rotulo="Local (opcional)"
        name="local"
        maxLength={120}
        placeholder="Ex.: Petrolina"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        erro={erros?.local}
      />

      <SeletorData valor={data} aoMudar={setData} erros={erros} />

      <div className="grid gap-1.5">
        <Label htmlFor="item-descricao">
          Descrição <span className="text-muted-foreground font-normal">(opcional)</span>
        </Label>
        <Textarea
          id="item-descricao"
          name="descricao"
          rows={3}
          maxLength={2000}
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />
      </div>

      {embutido ? (
        <div className="flex justify-end">
          <Button type="submit" disabled={ocupado}>
            {pendente && <Loader2 className="animate-spin" aria-hidden />}
            Salvar alterações
          </Button>
        </div>
      ) : (
        <DialogFooter className="items-center sm:justify-between">
          {/* Arquivar/excluir: só admin. */}
          {item && eAdmin ? <AcoesAdminItem item={item} aoRemover={aoFechar} /> : <span />}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={aoFechar} disabled={ocupado}>
              Cancelar
            </Button>
            <Button type="submit" disabled={ocupado}>
              {pendente && <Loader2 className="animate-spin" aria-hidden />}
              {item ? "Salvar" : "Criar item"}
            </Button>
          </div>
        </DialogFooter>
      )}
    </form>
  );
}

export function DialogItem({
  aberto,
  item,
  padrao,
  frentes,
  eAdmin,
  aoFechar,
  aoCriar,
}: {
  aberto: boolean;
  item?: ItemEditavel;
  padrao?: PadraoItem;
  frentes: Frente[];
  eAdmin: boolean;
  aoFechar: () => void;
  aoCriar?: (id: string) => void;
}) {
  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && aoFechar()}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{item ? "Editar item" : "Novo item"}</DialogTitle>
          <DialogDescription>
            Qualquer ação é um item: um evento, uma viagem, um podcast, uma ação social. Depois de
            criar, o item abre para você adicionar pessoas, tarefas, decisões e notas.
          </DialogDescription>
        </DialogHeader>
        {aberto && (
          <FormItem
            key={item?.id ?? "novo"}
            item={item}
            padrao={padrao}
            frentes={frentes}
            eAdmin={eAdmin}
            aoFechar={aoFechar}
            aoSalvar={item ? undefined : aoCriar}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
