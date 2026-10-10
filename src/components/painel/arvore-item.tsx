"use client";

import { useState } from "react";
import { ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { usePainel } from "@/components/painel/contexto-painel";
import {
  AdicionarPessoa,
  CabecalhoDecisao,
  LinhaNota,
  LinhaOpcao,
  LinhaPessoa,
  LinhaTarefa,
} from "@/components/painel/ramos";
import { RAMOS, contagemRamo, type ChaveRamo } from "@/components/painel/ramos-config";
import { NovoFilho } from "@/components/painel/texto-editavel";
import { cn } from "@/lib/utils";
import { criarDecisao, criarNota, criarOpcao, criarTarefa } from "@/server/actions/ramos";

/** O mesmo conteúdo do mapa mental, como árvore vertical recolhível (celular). */
export function ArvoreItem() {
  const { detalhe } = usePainel();
  const [abertos, setAbertos] = useState<Set<ChaveRamo>>(() => new Set());
  const [adicionando, setAdicionando] = useState<ChaveRamo | null>(null);

  const alternar = (c: ChaveRamo, aberto: boolean) =>
    setAbertos((a) => {
      const n = new Set(a);
      if (aberto) n.add(c);
      else n.delete(c);
      return n;
    });

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-2">
      {RAMOS.map((r) => {
        const aberto = abertos.has(r.chave);
        return (
          <Collapsible
            key={r.chave}
            open={aberto}
            onOpenChange={(o) => alternar(r.chave, o)}
            className="rounded-xl border"
            style={{ borderLeftColor: r.cor, borderLeftWidth: 3 }}
          >
            <div className="flex items-center gap-1 pr-1.5">
              <CollapsibleTrigger className="focus-visible:ring-ring flex min-h-12 flex-1 items-center gap-2 px-3 text-left font-medium focus-visible:ring-2 focus-visible:outline-none">
                <ChevronRight
                  className={cn("size-4 transition-transform", aberto && "rotate-90")}
                  aria-hidden
                />
                <r.icone className="size-4" style={{ color: r.cor }} aria-hidden />
                {r.titulo}
                <span className="bg-muted ml-auto rounded px-1.5 text-xs tabular-nums">
                  {contagemRamo(r.chave, detalhe)}
                </span>
              </CollapsibleTrigger>
              {r.chave !== "lideres" && (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={r.rotuloAdicionar}
                  onClick={() => {
                    alternar(r.chave, true);
                    setAdicionando(r.chave);
                  }}
                >
                  <Plus aria-hidden />
                </Button>
              )}
            </div>
            <CollapsibleContent className="grid grid-cols-[minmax(0,1fr)] gap-2 border-t px-3 py-3">
              <ConteudoRamo
                chave={r.chave}
                adicionando={adicionando === r.chave}
                aoFecharAdicao={() => setAdicionando(null)}
              />
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );
}

function ConteudoRamo({
  chave,
  adicionando,
  aoFecharAdicao,
}: {
  chave: ChaveRamo;
  adicionando: boolean;
  aoFecharAdicao: () => void;
}) {
  const { detalhe, executar } = usePainel();
  const { item } = detalhe;
  const [subAberto, setSubAberto] = useState<string | null>(null);
  const [subAdicionando, setSubAdicionando] = useState<string | null>(null);

  switch (chave) {
    case "lideres":
      return (
        <>
          {detalhe.atribuicoes.length === 0 && (
            <p className="text-muted-foreground text-sm">Ninguém neste item ainda.</p>
          )}
          {detalhe.atribuicoes.map((a) => (
            <LinhaPessoa key={a.id} atribuicao={a} />
          ))}
          <AdicionarPessoa />
        </>
      );

    case "tarefas": {
      const raizes = detalhe.tarefas.filter((t) => !t.parent_id);
      return (
        <>
          {raizes.length === 0 && !adicionando && (
            <p className="text-muted-foreground text-sm">Nenhuma tarefa. Toque em + para criar.</p>
          )}
          {raizes.map((t) => {
            const subs = detalhe.tarefas.filter((s) => s.parent_id === t.id);
            const aberto = subAberto === t.id || subAdicionando === t.id;
            return (
              <div key={t.id} className="grid gap-1.5">
                <div className="flex items-center gap-1">
                  {subs.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => setSubAberto(aberto ? null : t.id)}
                      aria-expanded={aberto}
                      aria-label={`${aberto ? "Recolher" : "Expandir"} ${subs.length} subtarefas`}
                      className="text-muted-foreground flex size-6 shrink-0 items-center justify-center rounded"
                    >
                      <ChevronRight
                        className={cn("size-4 transition-transform", aberto && "rotate-90")}
                        aria-hidden
                      />
                    </button>
                  ) : (
                    <span className="w-6 shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <LinhaTarefa tarefa={t} aoAdicionarSubtarefa={() => setSubAdicionando(t.id)} />
                  </div>
                </div>
                {aberto && (
                  <div className="ml-9 grid gap-1.5 border-l pl-3">
                    {subs.map((s) => (
                      <LinhaTarefa key={s.id} tarefa={s} />
                    ))}
                    {subAdicionando === t.id && (
                      <NovoFilho
                        rotulo="Nova subtarefa"
                        placeholder="Nova subtarefa"
                        aoAdicionar={(titulo) => executar(() => criarTarefa(item.id, titulo, t.id))}
                        aoFechar={() => setSubAdicionando(null)}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {adicionando && (
            <NovoFilho
              rotulo="Nova tarefa"
              placeholder="Nova tarefa"
              aoAdicionar={(titulo) => executar(() => criarTarefa(item.id, titulo))}
              aoFechar={aoFecharAdicao}
            />
          )}
        </>
      );
    }

    case "decisoes":
      return (
        <>
          {detalhe.decisoes.length === 0 && !adicionando && (
            <p className="text-muted-foreground text-sm">Nenhuma decisão em aberto.</p>
          )}
          {detalhe.decisoes.map((d) => (
            <div key={d.id} className="grid gap-1.5 rounded-lg border p-2">
              <CabecalhoDecisao decisao={d} />
              <div
                className="ml-5.5 grid gap-1.5"
                role="radiogroup"
                aria-label={`Opções: ${d.pergunta}`}
              >
                {d.opcoes.map((o) => (
                  <LinhaOpcao key={o.id} decisao={d} opcao={o} />
                ))}
                <NovoFilho
                  rotulo={`Nova opção para ${d.pergunta}`}
                  placeholder="Nova opção"
                  aoAdicionar={(texto) => executar(() => criarOpcao(d.id, texto))}
                />
              </div>
            </div>
          ))}
          {adicionando && (
            <NovoFilho
              rotulo="Nova decisão"
              placeholder="Pergunta (ex.: Onde será?)"
              aoAdicionar={(p) => executar(() => criarDecisao(item.id, p))}
              aoFechar={aoFecharAdicao}
            />
          )}
        </>
      );

    case "notas":
      return (
        <>
          {detalhe.notas.length === 0 && (
            <p className="text-muted-foreground text-sm">Nenhuma nota ainda.</p>
          )}
          {detalhe.notas.map((n) => (
            <LinhaNota key={n.id} nota={n} />
          ))}
          <NovoFilho
            rotulo="Nova nota"
            placeholder="Escreva uma nota"
            multilinha
            aoAdicionar={(t) => executar(() => criarNota(item.id, t))}
            aoFechar={adicionando ? aoFecharAdicao : undefined}
          />
        </>
      );
  }
}
