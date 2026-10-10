"use client";

import { useMemo, useState, useTransition } from "react";
import { Check, Hand, Search, X } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { AvatarPessoa } from "@/components/comum/avatar-pessoa";
import { BadgeStatus } from "@/components/comum/badges";
import { ChipFrente } from "@/components/frentes/chip-frente";
import { Avatares } from "@/components/itens/card-item";
import { useItens } from "@/components/itens/provedor-itens";
import { formatarDataItem } from "@/lib/datas";
import { CARGA_VAZIA, porData, semResponsavel, type Carga } from "@/lib/panorama";
import { cn } from "@/lib/utils";
import { atribuirPessoas } from "@/server/actions/lideres";
import type { Frente } from "@/server/consultas/frentes";
import type { ItemResumo, PessoaResumo } from "@/server/consultas/itens";

const TIPO_ARRASTE = "application/x-movimento-pessoas";

const semAcento = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

/**
 * Atribuição rápida: no computador, arraste uma pessoa (ou as selecionadas)
 * para um item; no celular, toque nas pessoas e depois no item.
 */
export function AtribuicaoRapida({
  pessoas,
  itens,
  frentes,
  cargas,
}: {
  pessoas: PessoaResumo[];
  itens: ItemResumo[];
  frentes: Frente[];
  cargas: Map<string, Carga>;
}) {
  const { abrirItem } = useItens();
  const [selecionadas, setSelecionadas] = useState<string[]>([]);
  const [buscaPessoa, setBuscaPessoa] = useState("");
  const [buscaItem, setBuscaItem] = useState("");
  const [soSemDono, setSoSemDono] = useState(false);
  const [alvo, setAlvo] = useState<{ item: ItemResumo; pessoaIds: string[] } | null>(null);
  const [sobre, setSobre] = useState<string | null>(null);

  const pessoasVisiveis = pessoas.filter((p) =>
    semAcento(p.nome).includes(semAcento(buscaPessoa.trim())),
  );

  const grupos = useMemo(() => {
    const termo = semAcento(buscaItem.trim());
    return frentes
      .map((frente) => ({
        frente,
        itens: itens
          .filter(
            (i) =>
              i.frente_id === frente.id &&
              i.status !== "cancelado" &&
              (!soSemDono || semResponsavel(i)) &&
              (!termo || semAcento(i.titulo).includes(termo)),
          )
          .sort(porData()),
      }))
      .filter((g) => g.itens.length);
  }, [frentes, itens, buscaItem, soSemDono]);

  const alternar = (id: string) =>
    setSelecionadas((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const nome = (id: string) => pessoas.find((p) => p.id === id)?.nome ?? "";

  return (
    <div className="grid gap-4 md:grid-cols-[18rem_minmax(0,1fr)] md:items-start">
      <p className="text-muted-foreground flex items-start gap-2 text-sm md:col-span-2">
        <Hand className="mt-0.5 size-4 shrink-0" aria-hidden />
        <span>
          <span className="hidden md:inline">
            Arraste uma pessoa até um item (ou selecione várias e arraste juntas).{" "}
          </span>
          Toque nas pessoas para selecionar e depois no item para escolher o papel.
        </span>
      </p>

      {/* Pessoas */}
      <section
        aria-label="Pessoas"
        className="bg-card grid gap-2 rounded-xl border p-3 md:sticky md:top-28 md:max-h-[calc(100dvh-8rem)] md:overflow-y-auto"
      >
        <div className="relative">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
            aria-hidden
          />
          <Input
            type="search"
            placeholder="Buscar pessoa"
            aria-label="Buscar pessoa"
            value={buscaPessoa}
            onChange={(e) => setBuscaPessoa(e.target.value)}
            className="h-10 pl-8 md:h-9"
          />
        </div>
        <ul className="grid max-h-72 gap-1 overflow-y-auto md:max-h-none">
          {pessoasVisiveis.map((p) => {
            const marcada = selecionadas.includes(p.id);
            const c = cargas.get(p.id) ?? CARGA_VAZIA;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  draggable
                  onDragStart={(e) => {
                    const ids = marcada ? selecionadas : [p.id];
                    e.dataTransfer.setData(TIPO_ARRASTE, JSON.stringify(ids));
                    e.dataTransfer.effectAllowed = "copy";
                  }}
                  onClick={() => alternar(p.id)}
                  aria-pressed={marcada}
                  className={cn(
                    "hover:bg-muted focus-visible:ring-ring flex w-full cursor-grab items-center gap-2 rounded-lg border border-transparent px-2 py-1.5 text-left text-sm focus-visible:ring-2 focus-visible:outline-none active:cursor-grabbing",
                    marcada && "border-primary/40 bg-primary/5",
                  )}
                >
                  <AvatarPessoa nome={p.nome} iniciais={p.iniciais} regiao={p.regiao} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{p.nome}</span>
                    <span className="text-muted-foreground block text-xs">
                      {c.responsavel.length} resp. · {c.apoio.length} apoio
                    </span>
                  </span>
                  {marcada && <Check className="text-primary size-4 shrink-0" aria-hidden />}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Itens */}
      <section aria-label="Itens" className="grid gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-48 flex-1">
            <Search
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
              aria-hidden
            />
            <Input
              type="search"
              placeholder="Buscar item"
              aria-label="Buscar item"
              value={buscaItem}
              onChange={(e) => setBuscaItem(e.target.value)}
              className="h-10 pl-8 md:h-9"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={soSemDono} onCheckedChange={setSoSemDono} />
            Só sem responsável
          </label>
        </div>

        {grupos.length === 0 && (
          <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-center text-sm">
            Nenhum item encontrado.
          </p>
        )}

        {grupos.map(({ frente, itens: doGrupo }) => (
          <div key={frente.id} className="grid gap-1.5">
            <h3>
              <ChipFrente frente={frente} />
            </h3>
            <ul className="grid gap-1.5">
              {doGrupo.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() =>
                      selecionadas.length
                        ? setAlvo({ item, pessoaIds: selecionadas })
                        : abrirItem(item.id)
                    }
                    onDragOver={(e) => {
                      if (!e.dataTransfer.types.includes(TIPO_ARRASTE)) return;
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "copy";
                      setSobre(item.id);
                    }}
                    onDragLeave={() => setSobre((s) => (s === item.id ? null : s))}
                    onDrop={(e) => {
                      e.preventDefault();
                      setSobre(null);
                      try {
                        const ids = JSON.parse(e.dataTransfer.getData(TIPO_ARRASTE)) as string[];
                        if (ids.length) setAlvo({ item, pessoaIds: ids });
                      } catch {
                        /* arraste de outra coisa: ignora */
                      }
                    }}
                    className={cn(
                      "bg-card focus-visible:ring-ring flex w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border px-3 py-2 text-left text-sm transition focus-visible:ring-2 focus-visible:outline-none",
                      selecionadas.length
                        ? "hover:border-primary/60 hover:bg-primary/5"
                        : "hover:shadow-sm",
                      sobre === item.id && "border-primary bg-primary/10 ring-primary/30 ring-2",
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{item.titulo}</span>
                      <span className="text-muted-foreground block truncate text-xs">
                        {formatarDataItem(item)}
                        {item.local && ` · ${item.local}`}
                      </span>
                    </span>
                    <BadgeStatus status={item.status} className="max-sm:hidden" />
                    <Avatares item={item} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      {/* Barra de seleção (fixa embaixo) */}
      {selecionadas.length > 0 && (
        <div className="bg-background/95 fixed inset-x-0 bottom-0 z-30 border-t p-3 shadow-lg backdrop-blur md:inset-x-auto md:right-6 md:bottom-6 md:rounded-xl md:border">
          <div className="mx-auto flex max-w-3xl items-center gap-3">
            <span className="min-w-0 flex-1 truncate text-sm">
              <strong>{selecionadas.length}</strong>{" "}
              {selecionadas.length === 1 ? "selecionada" : "selecionadas"}:{" "}
              {selecionadas.map(nome).join(", ")}
              <span className="text-muted-foreground"> — toque num item</span>
            </span>
            <Button variant="ghost" size="sm" onClick={() => setSelecionadas([])}>
              <X aria-hidden /> Limpar
            </Button>
          </div>
        </div>
      )}

      <DialogAtribuir
        alvo={alvo}
        nome={nome}
        aoFechar={() => setAlvo(null)}
        aoConcluir={() => {
          setAlvo(null);
          setSelecionadas([]);
        }}
      />
    </div>
  );
}

function DialogAtribuir({
  alvo,
  nome,
  aoFechar,
  aoConcluir,
}: {
  alvo: { item: ItemResumo; pessoaIds: string[] } | null;
  nome: (id: string) => string;
  aoFechar: () => void;
  aoConcluir: () => void;
}) {
  const [pendente, iniciar] = useTransition();
  const item = alvo?.item;
  const ids = alvo?.pessoaIds ?? [];
  const uma = ids.length === 1;
  const atual = item?.responsavel;
  const jaResponsavel = uma && atual?.id === ids[0];

  const atribuir = (papel: "responsavel" | "apoio") =>
    item &&
    iniciar(async () => {
      const r = await atribuirPessoas(item.id, ids, papel);
      if (r.ok) {
        toast.success(r.mensagem);
        aoConcluir();
      } else toast.error(r.erro);
    });

  return (
    <Dialog open={!!alvo} onOpenChange={(o) => !o && aoFechar()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Atribuir em “{item?.titulo}”</DialogTitle>
          <DialogDescription>
            {ids.map(nome).join(", ")} — escolha o papel.
            {uma && atual && !jaResponsavel && (
              <> Se escolher responsável, {atual.nome} passa para apoio.</>
            )}
            {!uma && " Com várias pessoas, só dá para adicionar como apoio."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="outline" onClick={aoFechar} disabled={pendente}>
            Cancelar
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => atribuir("apoio")} disabled={pendente}>
              Apoio
            </Button>
            {uma && (
              <Button onClick={() => atribuir("responsavel")} disabled={pendente || jaResponsavel}>
                Responsável
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
