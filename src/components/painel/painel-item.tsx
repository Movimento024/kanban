"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ChevronRight,
  History,
  Link2,
  Maximize2,
  Minimize2,
  Pencil,
  Repeat,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BadgeDecisoes,
  BadgeRegiao,
  BadgeSemResponsavel,
  BadgeStatus,
} from "@/components/comum/badges";
import { AvatarPessoa } from "@/components/comum/avatar-pessoa";
import { IconeFrente } from "@/components/frentes/icone-frente";
import { AcoesAdminItem } from "@/components/itens/acoes-admin-item";
import { FormItem } from "@/components/itens/dialog-item";
import { useAbrirItem } from "@/components/itens/use-abrir-item";
import { ArvoreItem } from "@/components/painel/arvore-item";
import { Painel, type ContextoPainel } from "@/components/painel/contexto-painel";
import { HistoricoItem } from "@/components/painel/historico-item";
import { MapaMental } from "@/components/painel/mapa-mental";
import { EVENTO_ATIVIDADE, type AtividadeTempoReal } from "@/components/tempo-real/sincronizacao";
import { usePresencaItem, type PessoaPresente } from "@/components/tempo-real/use-presenca";
import { formatarDataItem, formatarDiaCurto } from "@/lib/datas";
import { descreverCadencia, distanciaEmDias, proximaOcorrencia } from "@/lib/recorrencia";
import { corFrente } from "@/lib/frentes";
import { cn } from "@/lib/utils";
import { carregarDetalheItem, meAtribuir } from "@/server/actions/ramos";
import type { DetalheItem } from "@/server/consultas/detalhe-item";
import type { Frente } from "@/server/consultas/frentes";
import type { Resultado } from "@/server/resultado";

/** true em telas de computador (≥ 768 px). No servidor, assume celular. */
function useTelaGrande() {
  return useSyncExternalStore(
    (avisar) => {
      const m = window.matchMedia("(min-width: 768px)");
      m.addEventListener("change", avisar);
      return () => m.removeEventListener("change", avisar);
    },
    () => window.matchMedia("(min-width: 768px)").matches,
    () => false,
  );
}

/**
 * Painel do item, aberto por ?item=<id> em qualquer tela. No computador mostra o
 * mapa mental; no celular, a árvore recolhível. Acima: edição dos campos; abaixo:
 * histórico do item.
 */
export function PainelItem({
  frentes,
  eu,
  eAdmin,
}: {
  frentes: Frente[];
  eu: PessoaPresente;
  eAdmin: boolean;
}) {
  const meuId = eu.id;
  const router = useRouter();
  const { itemAberto, fechar } = useAbrirItem();
  const telaGrande = useTelaGrande();
  const [carregado, setCarregado] = useState<DetalheItem | null>(null);
  const [telaCheia, setTelaCheia] = useState(false);
  // A seção "Editar detalhes" fica aberta só para o item em que foi aberta.
  const [detalhesDe, setDetalhesDe] = useState<string | null>(null);
  const detalhesAbertos = !!itemAberto && detalhesDe === itemAberto;
  const setDetalhesAbertos = (aberto: boolean) => setDetalhesDe(aberto ? itemAberto : null);
  // Só vale o detalhe do item que está na URL (respostas atrasadas de outro item são ignoradas).
  const detalhe = carregado && carregado.item.id === itemAberto ? carregado : null;

  const carregar = useCallback(
    async (id: string) => {
      const r = await carregarDetalheItem(id);
      if (r.ok) setCarregado(r.data);
      else {
        toast.error(r.erro);
        fechar();
      }
    },
    [fechar],
  );

  const presentes = usePresencaItem(itemAberto, eu);
  // Aviso de conflito: outra pessoa alterou o item enquanto eu editava os detalhes.
  const [conflito, setConflito] = useState<{ itemId: string; nome: string } | null>(null);
  const avisoConflito = conflito && conflito.itemId === itemAberto ? conflito : null;

  // Tempo real: mudanças de outras pessoas neste item recarregam o painel. Se eu
  // estiver editando os detalhes, avisa em vez de recarregar (para não perder a edição).
  useEffect(() => {
    function aoMudar(e: Event) {
      const a = (e as CustomEvent<AtividadeTempoReal>).detail;
      if (!itemAberto || a.item_id !== itemAberto || a.ator_id === meuId) return;
      if (a.entidade === "item" && a.acao === "editou" && detalhesAbertos) {
        const nome = carregado?.pessoas.find((p) => p.id === a.ator_id)?.nome ?? "outra pessoa";
        setConflito({ itemId: itemAberto, nome });
      } else void carregar(itemAberto);
    }
    window.addEventListener(EVENTO_ATIVIDADE, aoMudar);
    return () => window.removeEventListener(EVENTO_ATIVIDADE, aoMudar);
  }, [itemAberto, meuId, detalhesAbertos, carregado, carregar]);

  // Abre/troca de item conforme a URL (descarta a resposta se o item mudar no meio).
  useEffect(() => {
    if (!itemAberto) return;
    let valido = true;
    carregarDetalheItem(itemAberto).then((r) => {
      if (!valido) return;
      if (r.ok) setCarregado(r.data);
      else {
        toast.error(r.erro);
        fechar();
      }
    });
    return () => {
      valido = false;
    };
  }, [itemAberto, fechar]);

  const executar = useCallback<ContextoPainel["executar"]>(
    async (acao: () => Promise<Resultado>, otimista?: (d: DetalheItem) => DetalheItem) => {
      const anterior = detalhe;
      if (otimista && detalhe) setCarregado(otimista(detalhe));
      const r = await acao();
      if (!r.ok) {
        if (anterior) setCarregado(anterior);
        toast.error(r.erro);
        return false;
      }
      if (r.mensagem) toast.success(r.mensagem);
      if (itemAberto) await carregar(itemAberto);
      return true;
    },
    [detalhe, itemAberto, carregar],
  );

  const contexto = useMemo<ContextoPainel | null>(
    () =>
      detalhe && {
        detalhe,
        meuId,
        eAdmin,
        executar,
        abrirDetalhes: () => setDetalhesDe(detalhe.item.id),
      },
    [detalhe, meuId, eAdmin, executar],
  );

  async function copiarLink() {
    const url = `${window.location.origin}${window.location.pathname}?item=${itemAberto}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado. Quem abrir vai direto neste item.");
    } catch {
      toast.error("Não foi possível copiar. Copie o endereço da barra do navegador.");
    }
  }

  const item = detalhe?.item;
  const souDoItem = detalhe?.atribuicoes.some((a) => a.pessoa.id === meuId);
  const semResponsavel = detalhe && !detalhe.atribuicoes.some((a) => a.papel === "responsavel");
  const decisoesAbertas = detalhe?.decisoes.filter((d) => d.status === "aberta").length ?? 0;
  const cadencia = item ? descreverCadencia(item) : null;
  const proxima = item && item.status !== "cancelado" ? proximaOcorrencia(item) : null;

  return (
    <Sheet open={!!itemAberto} onOpenChange={(o) => !o && fechar()}>
      <SheetContent
        side="right"
        // Esc com um campo em edição só cancela a edição (não fecha o painel).
        onEscapeKeyDown={(e) => {
          const alvo = document.activeElement;
          if (alvo instanceof HTMLInputElement || alvo instanceof HTMLTextAreaElement)
            e.preventDefault();
        }}
        className={cn(
          "gap-0 overflow-x-hidden overflow-y-auto p-0 data-[side=right]:w-full",
          telaCheia
            ? "data-[side=right]:sm:max-w-full"
            : "data-[side=right]:sm:max-w-[min(1180px,96vw)]",
        )}
      >
        {!detalhe || !item || !contexto ? (
          <CarregandoPainel />
        ) : (
          <Painel.Provider value={contexto}>
            <SheetHeader className="bg-popover/95 sticky top-0 z-10 gap-2 border-b p-4 pr-12 backdrop-blur">
              {item.frente && (
                <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
                  <span
                    className={cn(
                      "flex size-5 items-center justify-center rounded",
                      corFrente(item.frente.cor).suave,
                    )}
                  >
                    <IconeFrente nome={item.frente.icone} className="size-3.5" />
                  </span>
                  {item.frente.nome}
                </span>
              )}
              <SheetTitle className="text-xl leading-tight">{item.titulo}</SheetTitle>
              <SheetDescription className="flex flex-wrap items-center gap-1.5">
                <BadgeStatus status={item.status} />
                <BadgeRegiao regiao={item.regiao} />
                <span className="text-xs">
                  {formatarDataItem(item)}
                  {item.data_texto && ` (${item.data_texto})`}
                  {item.local && ` · ${item.local}`}
                </span>
                {cadencia && (
                  <span className="flex items-center gap-1 text-xs">
                    <Repeat className="size-3" aria-hidden />
                    <span>{cadencia.charAt(0).toUpperCase() + cadencia.slice(1)}</span>
                    {proxima &&
                      ` · próxima ${formatarDiaCurto(proxima)} (${distanciaEmDias(proxima)})`}
                  </span>
                )}
                {item.canais.length > 0 && (
                  <span className="text-xs">{item.canais.join(" · ")}</span>
                )}
                {semResponsavel && <BadgeSemResponsavel />}
                <BadgeDecisoes total={decisoesAbertas} />
              </SheetDescription>
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {!souDoItem && (
                  <Button onClick={() => executar(() => meAtribuir(item.id))}>
                    <UserPlus aria-hidden /> Me atribuir
                  </Button>
                )}
                <Button variant="outline" onClick={copiarLink}>
                  <Link2 aria-hidden /> Copiar link
                </Button>
                {telaGrande && (
                  <Button variant="outline" onClick={() => setTelaCheia(!telaCheia)}>
                    {telaCheia ? <Minimize2 aria-hidden /> : <Maximize2 aria-hidden />}
                    {telaCheia ? "Sair da tela cheia" : "Tela cheia"}
                  </Button>
                )}
                <span className="flex-1" />
                {presentes.length > 0 && (
                  <span
                    className="text-muted-foreground flex items-center gap-1.5 text-xs"
                    aria-label={`Também com este item aberto: ${presentes.map((p) => p.nome).join(", ")}`}
                  >
                    <span className="relative flex size-2" aria-hidden>
                      <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-500 opacity-60" />
                      <span className="relative inline-flex size-2 rounded-full bg-green-500" />
                    </span>
                    <span className="flex -space-x-1.5">
                      {presentes.slice(0, 4).map((p) => (
                        <AvatarPessoa
                          key={p.id}
                          nome={`${p.nome} está vendo este item`}
                          iniciais={p.iniciais}
                          regiao={p.regiao}
                          tamanho="sm"
                          className="ring-popover ring-2"
                        />
                      ))}
                    </span>
                    {presentes.length > 4 && `+${presentes.length - 4}`}
                  </span>
                )}
                {eAdmin && <AcoesAdminItem item={item} aoRemover={fechar} />}
              </div>
              {avisoConflito && (
                <div
                  role="alert"
                  className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-500/60 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-200"
                >
                  <AlertTriangle className="size-4 shrink-0" aria-hidden />
                  <span className="min-w-0 flex-1">
                    Este item foi alterado por {avisoConflito.nome} agora há pouco.
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setConflito(null);
                      void carregar(item.id);
                    }}
                  >
                    Recarregar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setConflito(null)}>
                    Continuar editando
                  </Button>
                </div>
              )}
            </SheetHeader>

            <div className="grid grid-cols-[minmax(0,1fr)] gap-4 p-4">
              <Collapsible
                open={detalhesAbertos}
                onOpenChange={setDetalhesAbertos}
                className="rounded-xl border"
              >
                <CollapsibleTrigger className="focus-visible:ring-ring flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium focus-visible:ring-2 focus-visible:outline-none">
                  <ChevronRight
                    className={cn("size-4 transition-transform", detalhesAbertos && "rotate-90")}
                    aria-hidden
                  />
                  <Pencil className="text-muted-foreground size-4" aria-hidden />
                  Editar detalhes do item
                  <span className="text-muted-foreground ml-auto hidden truncate text-xs font-normal sm:block">
                    título, frente, região, local, status, data, recorrência e descrição
                  </span>
                </CollapsibleTrigger>
                <CollapsibleContent className="border-t p-3">
                  <FormItem
                    // Recomeça com os valores salvos quando o item muda (ex.: local definido por decisão).
                    key={item.updated_at}
                    item={item}
                    frentes={frentes}
                    eAdmin={eAdmin}
                    embutido
                    aoFechar={() => setDetalhesAbertos(false)}
                    aoSalvar={() => {
                      void carregar(item.id);
                      router.refresh();
                    }}
                  />
                </CollapsibleContent>
              </Collapsible>

              {item.descricao && !detalhesAbertos && (
                <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                  {item.descricao}
                </p>
              )}

              {telaGrande ? (
                <MapaMental className={telaCheia ? "h-[calc(100dvh-16rem)]" : "h-[560px]"} />
              ) : (
                <ArvoreItem />
              )}

              <section className="grid gap-2 border-t pt-4" aria-labelledby="titulo-historico">
                <h3 id="titulo-historico" className="flex items-center gap-1.5 text-sm font-medium">
                  <History className="text-muted-foreground size-4" aria-hidden /> Histórico do item
                </h3>
                <HistoricoItem />
              </section>
            </div>
          </Painel.Provider>
        )}
      </SheetContent>
    </Sheet>
  );
}

function CarregandoPainel() {
  return (
    <div className="grid gap-4 p-4" aria-busy="true">
      <SheetTitle className="sr-only">Carregando item</SheetTitle>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-7 w-2/3" />
      <div className="flex gap-2">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-20" />
      </div>
      <Skeleton className="h-11 w-full rounded-xl" />
      <Skeleton className="h-[420px] w-full rounded-xl" />
    </div>
  );
}
