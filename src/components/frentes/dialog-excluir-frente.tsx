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
import { Campo } from "@/components/comum/campo";
import { MensagemErro } from "@/components/comum/mensagem-erro";
import { enviarSemResetar, useErrosCampos } from "@/components/comum/use-erros-campos";
import { cn } from "@/lib/utils";
import { excluirFrente } from "@/server/actions/frentes";

type FrenteMin = { id: string; nome: string };
type Modo = "mover" | "excluir_itens";

function FormExcluir({
  frente,
  totalItens,
  outrasFrentes,
  aoFechar,
  aoExcluir,
}: {
  frente: FrenteMin;
  totalItens: number;
  outrasFrentes: FrenteMin[];
  aoFechar: () => void;
  aoExcluir?: () => void;
}) {
  const [estado, acao, pendente] = useActionState(excluirFrente, null);
  const [erros, limparErro] = useErrosCampos(estado);
  const [modo, setModo] = useState<Modo>(outrasFrentes.length ? "mover" : "excluir_itens");
  const [destino, setDestino] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const tratado = useRef<typeof estado>(null);

  useEffect(() => {
    if (estado?.ok && tratado.current !== estado) {
      tratado.current = estado;
      toast.success(estado.mensagem);
      aoFechar();
      aoExcluir?.();
    }
  }, [estado, aoFechar, aoExcluir]);

  const vazia = totalItens === 0;
  const podeEnviar =
    vazia ||
    (modo === "mover" && !!destino) ||
    (modo === "excluir_itens" && confirmacao.trim() === frente.nome);

  return (
    <form onSubmit={enviarSemResetar(acao)} onChange={limparErro} className="grid gap-4" noValidate>
      {estado && !estado.ok && !estado.campos && <MensagemErro>{estado.erro}</MensagemErro>}
      <input type="hidden" name="id" value={frente.id} />
      <input type="hidden" name="modo" value={vazia ? "vazia" : modo} />

      {vazia ? (
        <p className="text-muted-foreground text-sm">Esta frente não tem itens.</p>
      ) : (
        <fieldset className="grid gap-3">
          <legend className="mb-1 text-sm">
            Esta frente tem <strong>{totalItens}</strong> {totalItens === 1 ? "item" : "itens"}. O
            que fazer com {totalItens === 1 ? "ele" : "eles"}?
          </legend>

          {outrasFrentes.length > 0 && (
            <div
              className={cn(
                "grid gap-2 rounded-lg border p-3",
                modo === "mover" && "border-foreground",
              )}
            >
              <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                <input
                  type="radio"
                  name="opcao_modo"
                  checked={modo === "mover"}
                  onChange={() => setModo("mover")}
                  className="accent-foreground"
                />
                Mover os itens para outra frente
              </label>
              {modo === "mover" && (
                <div className="grid gap-1.5 pl-6">
                  <Label htmlFor="campo-destino" className="sr-only">
                    Frente de destino
                  </Label>
                  <Select name="destino" value={destino} onValueChange={setDestino}>
                    <SelectTrigger id="campo-destino" className="h-10 w-full md:h-9">
                      <SelectValue placeholder="Escolha a frente" />
                    </SelectTrigger>
                    <SelectContent>
                      {outrasFrentes.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {erros?.destino && <p className="text-destructive text-xs">{erros.destino}</p>}
                </div>
              )}
            </div>
          )}

          <div
            className={cn(
              "grid gap-2 rounded-lg border p-3",
              modo === "excluir_itens" && "border-destructive",
            )}
          >
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
              <input
                type="radio"
                name="opcao_modo"
                checked={modo === "excluir_itens"}
                onChange={() => setModo("excluir_itens")}
                className="accent-destructive"
              />
              Excluir os itens junto (com tarefas, decisões e notas)
            </label>
            {modo === "excluir_itens" && (
              <Campo
                className="pl-6"
                rotulo={`Para confirmar, digite “${frente.nome}”`}
                name="confirmacao"
                autoComplete="off"
                value={confirmacao}
                onChange={(e) => setConfirmacao(e.target.value)}
                erro={erros?.confirmacao}
              />
            )}
          </div>
        </fieldset>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={aoFechar} disabled={pendente}>
          Cancelar
        </Button>
        <Button type="submit" variant="destructive" disabled={pendente || !podeEnviar}>
          {pendente && <Loader2 className="animate-spin" aria-hidden />}
          Excluir frente
        </Button>
      </DialogFooter>
    </form>
  );
}

export function DialogExcluirFrente({
  aberto,
  frente,
  totalItens,
  outrasFrentes,
  aoFechar,
  aoExcluir,
}: {
  aberto: boolean;
  frente: FrenteMin;
  totalItens: number;
  outrasFrentes: FrenteMin[];
  aoFechar: () => void;
  aoExcluir?: () => void;
}) {
  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && aoFechar()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Excluir “{frente.nome}” definitivamente?</DialogTitle>
          <DialogDescription>
            Não dá para desfazer. Se quiser só tirar das telas, prefira arquivar.
          </DialogDescription>
        </DialogHeader>
        {aberto && (
          <FormExcluir
            key={frente.id}
            frente={frente}
            totalItens={totalItens}
            outrasFrentes={outrasFrentes}
            aoFechar={aoFechar}
            aoExcluir={aoExcluir}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
