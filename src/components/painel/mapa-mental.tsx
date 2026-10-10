"use client";

import "@xyflow/react/dist/style.css";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Handle,
  Panel,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  useStore,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import { useTheme } from "next-themes";
import { ChevronRight, ChevronsDownUp, ChevronsUpDown, Maximize, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BadgeRegiao, BadgeStatus } from "@/components/comum/badges";
import { usePainel } from "@/components/painel/contexto-painel";
import {
  AdicionarPessoa,
  CabecalhoDecisao,
  LinhaNota,
  LinhaOpcao,
  LinhaPessoa,
  LinhaTarefa,
} from "@/components/painel/ramos";
import { RAMOS, type ChaveRamo, contagemRamo } from "@/components/painel/ramos-config";
import { NovoFilho } from "@/components/painel/texto-editavel";
import { formatarDataItem } from "@/lib/datas";
import { cn } from "@/lib/utils";
import { criarDecisao, criarNota, criarOpcao, criarTarefa } from "@/server/actions/ramos";

// ---------------------------------------------------------------
// Geometria
// ---------------------------------------------------------------

const LARGURA = { centro: 280, ramo: 210, n2: 300, n3: 270 };
const ALTURA: Record<string, number> = {
  centro: 116,
  ramo: 48,
  pessoa: 52,
  tarefa: 44,
  subtarefa: 40,
  decisao: 60,
  opcao: 38,
  nota: 76,
  adicionar: 44,
};
const ESPACO_V = 10;
const ESPACO_H = 70;

type Arvore = {
  id: string;
  tipo: keyof typeof ALTURA;
  largura: number;
  conteudo: React.ReactNode;
  cor?: string;
  filhos: Arvore[];
};

type DadosNo = {
  conteudo: React.ReactNode;
  tipo: string;
  largura: number;
  altura: number;
  lado: 1 | -1;
  cor?: string;
};

const alturaSubarvore = (n: Arvore): number =>
  Math.max(
    ALTURA[n.tipo],
    n.filhos.reduce((s, f) => s + alturaSubarvore(f), 0) +
      ESPACO_V * Math.max(n.filhos.length - 1, 0),
  );

/** Posiciona uma subárvore à direita (lado 1) ou à esquerda (lado -1) de `xBase`. */
function posicionar(
  n: Arvore,
  xBase: number,
  yTopo: number,
  lado: 1 | -1,
  pai: string,
  nos: Node<DadosNo>[],
  arestas: Edge[],
) {
  const h = alturaSubarvore(n);
  const altura = ALTURA[n.tipo];
  const x = lado === 1 ? xBase : xBase - n.largura;
  nos.push({
    id: n.id,
    type: "no",
    position: { x, y: yTopo + h / 2 - altura / 2 },
    // Tamanho fixo e conhecido: sem isso o React Flow esconde o nó até medi-lo.
    width: n.largura,
    height: altura,
    data: { conteudo: n.conteudo, tipo: n.tipo, largura: n.largura, altura, lado, cor: n.cor },
    draggable: false,
    selectable: false,
  });
  arestas.push({
    id: `${pai}->${n.id}`,
    source: pai,
    target: n.id,
    sourceHandle: lado === 1 ? "direita" : "esquerda",
    targetHandle: lado === 1 ? "entrada-esquerda" : "entrada-direita",
    style: { stroke: n.cor ?? "var(--border)", strokeWidth: 1.5 },
  });

  const somaFilhos =
    n.filhos.reduce((s, f) => s + alturaSubarvore(f), 0) +
    ESPACO_V * Math.max(n.filhos.length - 1, 0);
  let y = yTopo + (h - somaFilhos) / 2;
  const xFilhos = lado === 1 ? x + n.largura + ESPACO_H : x - ESPACO_H;
  for (const f of n.filhos) {
    posicionar(f, xFilhos, y, lado, n.id, nos, arestas);
    y += alturaSubarvore(f) + ESPACO_V;
  }
}

// ---------------------------------------------------------------
// Nó genérico
// ---------------------------------------------------------------

function NoMapa({ data }: NodeProps<Node<DadosNo>>) {
  const centro = data.tipo === "centro";
  const ramo = data.tipo === "ramo";
  return (
    <div
      style={{ width: data.largura, height: data.altura, borderColor: ramo ? data.cor : undefined }}
      className={cn(
        "bg-card text-card-foreground flex items-center rounded-lg border px-2.5 shadow-xs",
        centro && "border-foreground/70 border-2 px-3 shadow-md",
        ramo && "bg-background border-2 font-medium",
        data.tipo === "adicionar" && "border-0 bg-transparent px-0 shadow-none",
      )}
    >
      {/* Conectores invisíveis dos dois lados */}
      <Handle
        type="source"
        position={Position.Right}
        id="direita"
        className="!opacity-0"
        isConnectable={false}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="esquerda"
        className="!opacity-0"
        isConnectable={false}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="entrada-esquerda"
        className="!opacity-0"
        isConnectable={false}
      />
      <Handle
        type="target"
        position={Position.Right}
        id="entrada-direita"
        className="!opacity-0"
        isConnectable={false}
      />
      <div className="w-full min-w-0">{data.conteudo}</div>
    </div>
  );
}

const tiposDeNo = { no: NoMapa };
const ignorarCliqueNoNo = () => {};

// ---------------------------------------------------------------
// Mapa
// ---------------------------------------------------------------

function Mapa() {
  const { detalhe, executar } = usePainel();
  const { item, atribuicoes, tarefas, decisoes, notas } = detalhe;
  const { fitView, zoomIn, zoomOut } = useReactFlow();
  const { resolvedTheme } = useTheme();
  const [expandidos, setExpandidos] = useState<Set<string>>(() => new Set());
  const [adicionando, setAdicionando] = useState<string | null>(null);

  const alternar = useCallback((chave: string) => {
    setExpandidos((atual) => {
      const novo = new Set(atual);
      if (novo.has(chave)) novo.delete(chave);
      else novo.add(chave);
      return novo;
    });
  }, []);
  const abrirAdicao = useCallback((chave: string, expandir: string) => {
    setExpandidos((atual) => new Set(atual).add(expandir));
    setAdicionando(chave);
  }, []);

  const expandirTudo = () =>
    setExpandidos(
      new Set([
        ...RAMOS.map((r) => `ramo:${r.chave}`),
        ...tarefas.filter((t) => !t.parent_id).map((t) => `tarefa:${t.id}`),
        ...decisoes.map((d) => `decisao:${d.id}`),
      ]),
    );

  const { nos, arestas } = useMemo(() => {
    const raizes = tarefas.filter((t) => !t.parent_id);
    const subDe = (id: string) => tarefas.filter((t) => t.parent_id === id);
    const fecharAdicao = () => setAdicionando(null);

    const novoFilho = (
      id: string,
      rotulo: string,
      placeholder: string,
      fn: (t: string) => Promise<boolean>,
      multilinha = false,
      fechavel = true,
    ): Arvore => ({
      id,
      tipo: "adicionar",
      largura: LARGURA.n2,
      filhos: [],
      conteudo: (
        <NovoFilho
          rotulo={rotulo}
          placeholder={placeholder}
          aoAdicionar={fn}
          aoFechar={fechavel ? fecharAdicao : undefined}
          multilinha={multilinha}
        />
      ),
    });

    const filhosDoRamo = (chave: ChaveRamo, cor: string): Arvore[] => {
      switch (chave) {
        case "lideres":
          return [
            ...atribuicoes.map((a) => ({
              id: `pessoa:${a.id}`,
              tipo: "pessoa" as const,
              largura: LARGURA.n2,
              cor,
              filhos: [],
              conteudo: <LinhaPessoa atribuicao={a} />,
            })),
            {
              id: "adicionar:pessoa",
              tipo: "adicionar" as const,
              largura: LARGURA.n2,
              filhos: [],
              conteudo: <AdicionarPessoa className="w-full" />,
            },
          ];
        case "tarefas":
          return [
            ...raizes.map((t) => {
              const subs = subDe(t.id);
              const aberta = expandidos.has(`tarefa:${t.id}`);
              const filhos: Arvore[] = aberta
                ? subs.map((s) => ({
                    id: `tarefa:${s.id}`,
                    tipo: "subtarefa" as const,
                    largura: LARGURA.n3,
                    cor,
                    filhos: [],
                    conteudo: <LinhaTarefa tarefa={s} />,
                  }))
                : [];
              if (adicionando === `sub:${t.id}`)
                filhos.push(
                  novoFilho(
                    `adicionar:sub:${t.id}`,
                    "Nova subtarefa",
                    "Nova subtarefa e Enter",
                    (titulo) => executar(() => criarTarefa(item.id, titulo, t.id)),
                  ),
                );
              return {
                id: `tarefa:${t.id}`,
                tipo: "tarefa" as const,
                largura: LARGURA.n2,
                cor,
                filhos,
                conteudo: (
                  <div className="flex items-center gap-1">
                    {subs.length > 0 && (
                      <BotaoExpandir
                        aberto={aberta}
                        rotulo={`${subs.length} subtarefas`}
                        aoClicar={() => alternar(`tarefa:${t.id}`)}
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <LinhaTarefa
                        tarefa={t}
                        aoAdicionarSubtarefa={() => abrirAdicao(`sub:${t.id}`, `tarefa:${t.id}`)}
                      />
                    </div>
                  </div>
                ),
              };
            }),
            ...(adicionando === "tarefas"
              ? [
                  novoFilho("adicionar:tarefa", "Nova tarefa", "Nova tarefa e Enter", (titulo) =>
                    executar(() => criarTarefa(item.id, titulo)),
                  ),
                ]
              : []),
          ];
        case "decisoes":
          return [
            ...decisoes.map((d) => {
              const aberta = expandidos.has(`decisao:${d.id}`);
              return {
                id: `decisao:${d.id}`,
                tipo: "decisao" as const,
                largura: LARGURA.n2,
                cor,
                filhos: aberta
                  ? [
                      ...d.opcoes.map((o) => ({
                        id: `opcao:${o.id}`,
                        tipo: "opcao" as const,
                        largura: LARGURA.n3,
                        cor,
                        filhos: [],
                        conteudo: <LinhaOpcao decisao={d} opcao={o} />,
                      })),
                      novoFilho(
                        `adicionar:opcao:${d.id}`,
                        "Nova opção",
                        "Nova opção e Enter",
                        (texto) => executar(() => criarOpcao(d.id, texto)),
                        false,
                        false,
                      ),
                    ]
                  : [],
                conteudo: (
                  <div className="flex items-center gap-1">
                    <BotaoExpandir
                      aberto={aberta}
                      rotulo="opções"
                      aoClicar={() => alternar(`decisao:${d.id}`)}
                    />
                    <div className="min-w-0 flex-1">
                      <CabecalhoDecisao decisao={d} />
                    </div>
                  </div>
                ),
              };
            }),
            ...(adicionando === "decisoes"
              ? [
                  novoFilho(
                    "adicionar:decisao",
                    "Nova decisão",
                    "Pergunta (ex.: Onde será?) e Enter",
                    (p) => executar(() => criarDecisao(item.id, p)),
                  ),
                ]
              : []),
          ];
        case "notas":
          return [
            ...notas.map((n) => ({
              id: `nota:${n.id}`,
              tipo: "nota" as const,
              largura: LARGURA.n2,
              cor,
              filhos: [],
              conteudo: <LinhaNota nota={n} compacta />,
            })),
            ...(adicionando === "notas"
              ? [
                  novoFilho(
                    "adicionar:nota",
                    "Nova nota",
                    "Escreva e Enter (Shift+Enter quebra linha)",
                    (t) => executar(() => criarNota(item.id, t)),
                    true,
                  ),
                ]
              : []),
          ];
      }
    };

    const ramos = RAMOS.map((r) => {
      const aberto = expandidos.has(`ramo:${r.chave}`);
      const total = contagemRamo(r.chave, detalhe);
      return {
        lado: r.lado,
        arvore: {
          id: `ramo:${r.chave}`,
          tipo: "ramo" as const,
          largura: LARGURA.ramo,
          cor: r.cor,
          filhos: aberto ? filhosDoRamo(r.chave, r.cor) : [],
          conteudo: (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => alternar(`ramo:${r.chave}`)}
                aria-expanded={aberto}
                className="nodrag nopan focus-visible:ring-ring flex min-w-0 flex-1 items-center gap-1.5 rounded-sm text-sm focus-visible:ring-2 focus-visible:outline-none"
              >
                <ChevronRight
                  className={cn("size-4 shrink-0 transition-transform", aberto && "rotate-90")}
                  aria-hidden
                />
                <r.icone className="size-4 shrink-0" style={{ color: r.cor }} aria-hidden />
                <span className="truncate">{r.titulo}</span>
                <span className="bg-muted ml-auto rounded px-1.5 text-xs whitespace-nowrap tabular-nums">
                  {total}
                </span>
              </button>
              {r.chave !== "lideres" && (
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="nodrag nopan"
                  aria-label={r.rotuloAdicionar}
                  onClick={() => abrirAdicao(r.chave, `ramo:${r.chave}`)}
                >
                  <Plus aria-hidden />
                </Button>
              )}
              {r.chave === "lideres" && !aberto && (
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="nodrag nopan"
                  aria-label={r.rotuloAdicionar}
                  onClick={() => alternar("ramo:lideres")}
                >
                  <Plus aria-hidden />
                </Button>
              )}
            </div>
          ),
        } satisfies Arvore,
      };
    });

    const nos: Node<DadosNo>[] = [
      {
        id: "centro",
        type: "no",
        position: { x: -LARGURA.centro / 2, y: -ALTURA.centro / 2 },
        width: LARGURA.centro,
        height: ALTURA.centro,
        draggable: false,
        selectable: false,
        data: {
          tipo: "centro",
          largura: LARGURA.centro,
          altura: ALTURA.centro,
          lado: 1,
          conteudo: (
            <div className="grid gap-1">
              <p className="line-clamp-2 leading-tight font-semibold">{item.titulo}</p>
              <p className="text-muted-foreground truncate text-xs">
                {formatarDataItem(item)}
                {item.local && ` · ${item.local}`}
              </p>
              <div className="flex flex-wrap gap-1">
                <BadgeStatus status={item.status} />
                <BadgeRegiao regiao={item.regiao} />
              </div>
            </div>
          ),
        },
      },
    ];
    const arestas: Edge[] = [];

    for (const lado of [1, -1] as const) {
      const doLado = ramos.filter((r) => r.lado === lado).map((r) => r.arvore);
      const total =
        doLado.reduce((s, r) => s + alturaSubarvore(r), 0) +
        ESPACO_V * 3 * Math.max(doLado.length - 1, 0);
      let y = -total / 2;
      const xBase = lado * (LARGURA.centro / 2 + ESPACO_H);
      for (const r of doLado) {
        posicionar(r, xBase, y, lado, "centro", nos, arestas);
        y += alturaSubarvore(r) + ESPACO_V * 3;
      }
    }
    return { nos, arestas };
  }, [
    detalhe,
    item,
    atribuicoes,
    tarefas,
    decisoes,
    notas,
    expandidos,
    adicionando,
    alternar,
    abrirAdicao,
    executar,
  ]);

  // Reenquadra quando a estrutura muda (expandir/recolher, novo filho) e quando o
  // mapa muda de tamanho (o painel abre com animação; tela cheia).
  const estrutura = nos.map((n) => n.id).join("|");
  const larguraTela = useStore((s) => s.width);
  const alturaTela = useStore((s) => s.height);
  useEffect(() => {
    if (!larguraTela || !alturaTela) return;
    const t = setTimeout(() => fitView({ padding: 0.12, maxZoom: 1 }), 60);
    return () => clearTimeout(t);
  }, [estrutura, larguraTela, alturaTela, fitView]);

  return (
    <ReactFlow
      nodes={nos}
      edges={arestas}
      nodeTypes={tiposDeNo}
      colorMode={resolvedTheme === "dark" ? "dark" : "light"}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      // Sem um handler de clique, o React Flow desliga pointer-events dos nós e os
      // botões dentro deles param de responder ao mouse.
      onNodeClick={ignorarCliqueNoNo}
      fitView
      fitViewOptions={{ padding: 0.12, maxZoom: 1 }}
      minZoom={0.25}
      maxZoom={1.5}
      zoomOnDoubleClick={false}
      aria-label="Mapa mental do item. Arraste o fundo para mover; use a roda do mouse ou os botões para aproximar."
    >
      <Panel position="top-left" className="flex flex-wrap gap-1">
        <Button size="sm" variant="outline" onClick={expandirTudo}>
          <ChevronsUpDown aria-hidden /> Expandir tudo
        </Button>
        <Button size="sm" variant="outline" onClick={() => setExpandidos(new Set())}>
          <ChevronsDownUp aria-hidden /> Recolher tudo
        </Button>
      </Panel>
      <Panel position="bottom-right" className="flex gap-1">
        <Button
          size="icon-sm"
          variant="outline"
          aria-label="Aproximar"
          onClick={() => zoomIn({ duration: 150 })}
        >
          <Plus aria-hidden />
        </Button>
        <Button
          size="icon-sm"
          variant="outline"
          aria-label="Afastar"
          onClick={() => zoomOut({ duration: 150 })}
        >
          <Minus aria-hidden />
        </Button>
        <Button
          size="icon-sm"
          variant="outline"
          aria-label="Enquadrar tudo"
          onClick={() => fitView({ padding: 0.12, duration: 250 })}
        >
          <Maximize aria-hidden />
        </Button>
      </Panel>
    </ReactFlow>
  );
}

function BotaoExpandir({
  aberto,
  rotulo,
  aoClicar,
}: {
  aberto: boolean;
  rotulo: string;
  aoClicar: () => void;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        aoClicar();
      }}
      aria-expanded={aberto}
      aria-label={`${aberto ? "Recolher" : "Expandir"} ${rotulo}`}
      className="nodrag nopan text-muted-foreground hover:bg-muted focus-visible:ring-ring -ml-1 flex size-5 shrink-0 items-center justify-center rounded focus-visible:ring-2 focus-visible:outline-none"
    >
      <ChevronRight
        className={cn("size-4 transition-transform", aberto && "rotate-90")}
        aria-hidden
      />
    </button>
  );
}

export function MapaMental({ className }: { className?: string }) {
  return (
    <div className={cn("bg-muted/20 rounded-xl border", className)}>
      <ReactFlowProvider>
        <Mapa />
      </ReactFlowProvider>
    </div>
  );
}
