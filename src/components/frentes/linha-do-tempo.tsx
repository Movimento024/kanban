"use client";

import { useEffect, useMemo, useRef } from "react";
import { format } from "date-fns";
import { CardItem } from "@/components/itens/card-item";
import { useItens } from "@/components/itens/provedor-itens";
import {
  COR_REGIAO_ITEM,
  REGIOES_ITEM,
  ROTULO_REGIAO_ITEM,
  type RegiaoItem,
} from "@/lib/constantes";
import { hoje, mesesEntre, paraData, posicaoNaRegua, rotuloMesCurto } from "@/lib/datas";
import { cn } from "@/lib/utils";
import type { ItemResumo } from "@/server/consultas/itens";

const LARGURA_MES = 120;
const LARGURA_MIN_CARD = 176;
const ALTURA_CARD = 78;
const ESPACO = 6;
const LARGURA_COLUNA = 208;
/** Fim mínimo da régua: o planejamento vai até 2028. */
const FIM_PLANEJAMENTO = new Date(2028, 11, 1);

type Posicionado = { item: ItemResumo; x: number; largura: number; linha: number };

/** Distribui os cards em linhas para não se sobreporem (o primeiro espaço livre). */
function empilhar(itens: { item: ItemResumo; x: number; largura: number }[]): {
  cards: Posicionado[];
  linhas: number;
} {
  const fimDasLinhas: number[] = [];
  const cards = [...itens]
    .sort((a, b) => a.x - b.x || b.largura - a.largura)
    .map((c) => {
      let linha = fimDasLinhas.findIndex((fim) => fim + ESPACO <= c.x);
      if (linha === -1) linha = fimDasLinhas.push(0) - 1;
      fimDasLinhas[linha] = c.x + c.largura;
      return { ...c, linha };
    });
  return { cards, linhas: Math.max(fimDasLinhas.length, 1) };
}

/**
 * `frenteId`: frente que o clique numa raia vazia pré-preenche (na Visão geral
 * não há uma só frente). `regioes`: raias exibidas (filtro de região).
 */
export function LinhaDoTempo({
  frenteId,
  itens,
  regioes = REGIOES_ITEM,
}: {
  frenteId?: string;
  itens: ItemResumo[];
  regioes?: readonly RegiaoItem[];
}) {
  const { novoItem } = useItens();
  const rolagem = useRef<HTMLDivElement>(null);
  const dataHoje = useMemo(() => hoje(), []);

  const { meses, primeiro } = useMemo(() => {
    const datados = itens.filter((i) => i.data_inicio);
    const inicios = datados.map((i) => paraData(i.data_inicio!));
    const fins = datados.map((i) => paraData(i.data_fim!));
    const de = new Date(Math.min(dataHoje.getTime(), ...inicios.map((d) => d.getTime())));
    const ate = new Date(Math.max(FIM_PLANEJAMENTO.getTime(), ...fins.map((d) => d.getTime())));
    const meses = mesesEntre(de, ate);
    return { meses, primeiro: meses[0] };
  }, [itens, dataHoje]);

  const larguraTotal = meses.length * LARGURA_MES;
  const xHoje = posicaoNaRegua(primeiro, dataHoje) * LARGURA_MES;

  const raias = useMemo(
    () =>
      regioes.map((regiao) => {
        const daRegiao = itens.filter((i) => i.regiao === regiao);
        const semData = daRegiao.filter((i) => !i.data_inicio);
        const { cards, linhas } = empilhar(
          daRegiao
            .filter((i) => i.data_inicio)
            .map((item) => {
              const x = posicaoNaRegua(primeiro, paraData(item.data_inicio!)) * LARGURA_MES;
              const xFim = posicaoNaRegua(primeiro, paraData(item.data_fim!), true) * LARGURA_MES;
              return { item, x, largura: Math.max(xFim - x, LARGURA_MIN_CARD) };
            }),
        );
        const alturaLinhas = linhas * (ALTURA_CARD + ESPACO) + ESPACO;
        const alturaSemData = semData.length * (ALTURA_CARD + ESPACO) + ESPACO + 28;
        return { regiao, semData, cards, altura: Math.max(alturaLinhas, alturaSemData, 120) };
      }),
    [itens, primeiro, regioes],
  );

  // Agrupamentos da régua: ano → semestre → mês.
  const anos = useMemo(() => agrupar(meses, (m) => String(m.getFullYear())), [meses]);
  const semestres = useMemo(
    () =>
      agrupar(
        meses,
        (m) => `${m.getMonth() < 6 ? "1º" : "2º"} sem/${String(m.getFullYear()).slice(2)}`,
      ),
    [meses],
  );

  // Começa mostrando o mês atual.
  useEffect(() => {
    const inicioMesAtual = Math.floor(xHoje / LARGURA_MES) * LARGURA_MES;
    rolagem.current?.scrollTo({ left: Math.max(inicioMesAtual - 8, 0) });
  }, [xHoje]);

  function criarNaRaia(regiao: RegiaoItem, e: React.MouseEvent<HTMLDivElement>) {
    const x = e.clientX - e.currentTarget.getBoundingClientRect().left;
    const mes = meses[Math.min(Math.max(Math.floor(x / LARGURA_MES), 0), meses.length - 1)];
    novoItem({
      frente_id: frenteId,
      regiao,
      data: { precisao: "mes", mes: format(mes, "yyyy-MM") },
    });
  }

  return (
    <div
      ref={rolagem}
      className="bg-muted/20 relative overflow-x-auto rounded-xl border"
      role="region"
      aria-label="Linha do tempo (role para os lados)"
      tabIndex={0}
    >
      <div className="relative" style={{ width: LARGURA_COLUNA + larguraTotal }}>
        {/* Régua */}
        <div className="bg-background sticky top-0 z-20 flex border-b">
          <div
            className="bg-background text-muted-foreground sticky left-0 z-30 flex shrink-0 items-end border-r px-3 pb-1.5 text-xs font-medium"
            style={{ width: LARGURA_COLUNA }}
          >
            Sem data
          </div>
          <div style={{ width: larguraTotal }}>
            <FaixaRegua grupos={anos} classe="text-sm font-semibold" />
            <FaixaRegua grupos={semestres} classe="text-xs text-muted-foreground" />
            <div className="flex">
              {meses.map((m) => {
                const atual = format(m, "yyyy-MM") === format(dataHoje, "yyyy-MM");
                return (
                  <div
                    key={m.toISOString()}
                    className={cn(
                      "shrink-0 border-l py-1 text-center text-xs capitalize",
                      atual ? "text-foreground font-semibold" : "text-muted-foreground",
                    )}
                    style={{ width: LARGURA_MES }}
                  >
                    {rotuloMesCurto(m)}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Raias por região */}
        {raias.map(({ regiao, semData, cards, altura }) => (
          <div key={regiao} className="relative flex border-b last:border-b-0">
            {/* Coluna fixa: nome da raia + itens sem data */}
            <div
              className="bg-background/95 sticky left-0 z-10 shrink-0 border-r p-1.5 backdrop-blur"
              style={{ width: LARGURA_COLUNA, minHeight: altura }}
            >
              <span
                className={cn(
                  "mb-1.5 inline-block rounded-md px-1.5 py-0.5 text-xs font-semibold",
                  COR_REGIAO_ITEM[regiao],
                )}
              >
                {ROTULO_REGIAO_ITEM[regiao]}
              </span>
              <div className="grid gap-1.5">
                {semData.map((item) => (
                  <CardItem key={item.id} item={item} style={{ height: ALTURA_CARD }} />
                ))}
              </div>
            </div>

            {/* Área do tempo: clique num espaço vazio cria um item naquele mês e região */}
            <div
              className="relative cursor-copy"
              style={{ width: larguraTotal, height: altura }}
              onClick={(e) => criarNaRaia(regiao, e)}
              title={`Clique para criar um item em ${ROTULO_REGIAO_ITEM[regiao]} neste mês`}
            >
              {/* Grade dos meses */}
              <div className="pointer-events-none absolute inset-0 flex" aria-hidden>
                {meses.map((m) => (
                  <div
                    key={m.toISOString()}
                    className={cn(
                      "h-full shrink-0 border-l",
                      m.getMonth() === 0 && "border-l-foreground/25",
                    )}
                    style={{ width: LARGURA_MES }}
                  />
                ))}
              </div>
              {/* Hoje */}
              <div
                className="pointer-events-none absolute inset-y-0 w-px bg-red-500/70"
                style={{ left: xHoje }}
                aria-hidden
              />
              <ul aria-label={`Itens com data em ${ROTULO_REGIAO_ITEM[regiao]}`}>
                {cards.map(({ item, x, largura, linha }) => (
                  <li
                    key={item.id}
                    className="absolute"
                    style={{
                      left: x,
                      width: largura,
                      top: ESPACO + linha * (ALTURA_CARD + ESPACO),
                      height: ALTURA_CARD,
                    }}
                  >
                    <CardItem item={item} className="h-full w-full" />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

type Grupo = { rotulo: string; meses: number };

function agrupar(meses: Date[], chave: (m: Date) => string): Grupo[] {
  const grupos: Grupo[] = [];
  for (const m of meses) {
    const rotulo = chave(m);
    const ultimo = grupos[grupos.length - 1];
    if (ultimo?.rotulo === rotulo) ultimo.meses++;
    else grupos.push({ rotulo, meses: 1 });
  }
  return grupos;
}

function FaixaRegua({ grupos, classe }: { grupos: Grupo[]; classe: string }) {
  return (
    <div className="flex border-b">
      {grupos.map((g, i) => (
        <div
          key={`${g.rotulo}-${i}`}
          className={cn("shrink-0 truncate border-l px-2 py-1", classe)}
          style={{ width: g.meses * LARGURA_MES }}
        >
          {g.rotulo}
        </div>
      ))}
    </div>
  );
}
