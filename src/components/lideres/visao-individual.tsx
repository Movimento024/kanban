"use client";

import { useMemo, useOptimistic, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { AvatarPessoa } from "@/components/comum/avatar-pessoa";
import { ChipFrente } from "@/components/frentes/chip-frente";
import { useItens } from "@/components/itens/provedor-itens";
import { LinhaItem } from "@/components/itens/linha-item";
import { ListaDecisoes } from "@/components/itens/lista-decisoes";
import { ROTULO_REGIAO_PESSOA } from "@/lib/constantes";
import { formatarDiaIso } from "@/lib/datas";
import { CARGA_VAZIA, cargaPorPessoa, porData, tarefaAtrasada } from "@/lib/panorama";
import { cn } from "@/lib/utils";
import { editarTarefa } from "@/server/actions/ramos";
import type { Frente } from "@/server/consultas/frentes";
import type { ItemResumo, PessoaResumo } from "@/server/consultas/itens";
import type { Panorama, TarefaResumo } from "@/server/consultas/panorama";

function Secao({
  titulo,
  total,
  vazio,
  children,
}: {
  titulo: string;
  total: number;
  vazio: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-3">
      <h2 className="text-lg font-semibold">
        {titulo} <span className="text-muted-foreground font-normal">({total})</span>
      </h2>
      {total === 0 ? (
        <p className="text-muted-foreground rounded-xl border border-dashed p-4 text-sm">{vazio}</p>
      ) : (
        children
      )}
    </section>
  );
}

/** Itens agrupados por frente (na ordem das abas) e ordenados por data. */
function ItensPorFrente({ itens, frentes }: { itens: ItemResumo[]; frentes: Frente[] }) {
  const grupos = frentes
    .map((f) => ({ frente: f, itens: itens.filter((i) => i.frente_id === f.id).sort(porData()) }))
    .filter((g) => g.itens.length);
  return (
    <div className="grid gap-4">
      {grupos.map(({ frente, itens: doGrupo }) => (
        <div key={frente.id} className="grid gap-1.5">
          <h3>
            <ChipFrente frente={frente} />
          </h3>
          <ul className="grid gap-1.5 lg:grid-cols-2">
            {doGrupo.map((i) => (
              <li key={i.id}>
                <LinhaItem item={i} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function ListaTarefas({
  tarefas,
  itens,
}: {
  tarefas: TarefaResumo[];
  itens: Map<string, ItemResumo>;
}) {
  const { abrirItem } = useItens();
  const [, iniciar] = useTransition();
  const [otimistas, marcar] = useOptimistic(
    tarefas,
    (atual, { id, concluida }: { id: string; concluida: boolean }) =>
      atual.map((t) => (t.id === id ? { ...t, concluida } : t)),
  );
  // Abertas primeiro (por prazo), depois as concluídas.
  const ordenadas = [...otimistas].sort(
    (a, b) =>
      Number(a.concluida) - Number(b.concluida) ||
      (a.prazo ?? "9999").localeCompare(b.prazo ?? "9999"),
  );

  return (
    <ul className="grid gap-1.5 lg:grid-cols-2">
      {ordenadas.map((t) => {
        const item = itens.get(t.item_id);
        const atrasada = tarefaAtrasada(t);
        return (
          <li
            key={t.id}
            className="bg-card flex items-center gap-3 rounded-lg border px-3 py-2 text-sm"
          >
            <Checkbox
              checked={t.concluida}
              aria-label={t.concluida ? `Reabrir “${t.titulo}”` : `Concluir “${t.titulo}”`}
              onCheckedChange={(v) =>
                iniciar(async () => {
                  marcar({ id: t.id, concluida: v === true });
                  const r = await editarTarefa(t.id, { concluida: v === true });
                  if (!r.ok) toast.error(r.erro);
                })
              }
            />
            <button
              type="button"
              onClick={() => abrirItem(t.item_id)}
              className="focus-visible:ring-ring min-w-0 flex-1 rounded text-left focus-visible:ring-2 focus-visible:outline-none"
            >
              <span
                className={cn(
                  "block truncate",
                  t.concluida && "text-muted-foreground line-through",
                )}
              >
                {t.titulo}
              </span>
              <span className="text-muted-foreground block truncate text-xs">
                {item?.titulo}
                {t.prazo && (
                  <span className={cn(atrasada && "font-medium text-red-700 dark:text-red-300")}>
                    {" "}
                    · {atrasada ? "atrasada, era para " : "até "}
                    {formatarDiaIso(t.prazo)}
                  </span>
                )}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function VisaoIndividual({
  pessoa,
  panorama,
  frentes,
  euMesmo,
}: {
  pessoa: PessoaResumo;
  panorama: Panorama;
  frentes: Frente[];
  euMesmo: boolean;
}) {
  const carga = useMemo(
    () => cargaPorPessoa(panorama.itens, panorama.tarefas).get(pessoa.id) ?? CARGA_VAZIA,
    [panorama, pessoa.id],
  );
  const itensPorId = useMemo(() => new Map(panorama.itens.map((i) => [i.id, i])), [panorama.itens]);
  const tarefas = panorama.tarefas.filter((t) => t.responsavel_id === pessoa.id);
  const abertas = tarefas.filter((t) => !t.concluida).length;
  const meusItens = new Set(carga.responsavel.map((i) => i.id));
  const decisoes = panorama.decisoesAbertas.filter((d) => meusItens.has(d.item_id));
  const sobrecarga = carga.responsavel.length > panorama.limiteSobrecarga;

  return (
    <div className="grid gap-8">
      <div className="grid gap-4">
        <Link
          href="/lideres"
          className="text-muted-foreground hover:text-foreground flex w-fit items-center gap-1 text-sm"
        >
          <ArrowLeft className="size-4" aria-hidden /> Por líder
        </Link>
        <div className="flex items-center gap-4">
          <AvatarPessoa
            nome={pessoa.nome}
            iniciais={pessoa.iniciais}
            regiao={pessoa.regiao}
            tamanho="lg"
            className="size-14 text-lg"
          />
          <div className="grid min-w-0 gap-0.5">
            <h1 className="truncate text-2xl font-semibold tracking-tight">
              {euMesmo ? "Minhas responsabilidades" : pessoa.nome}
            </h1>
            <p className="text-muted-foreground text-sm">
              {euMesmo ? `${pessoa.nome} · ` : ""}
              {ROTULO_REGIAO_PESSOA[pessoa.regiao]} · {carga.responsavel.length} como responsável ·{" "}
              {carga.apoio.length} como apoio · {abertas}{" "}
              {abertas === 1 ? "tarefa aberta" : "tarefas abertas"}
            </p>
            {sobrecarga && (
              <p className="text-sm font-medium text-red-700 dark:text-red-300">
                Sobrecarregado: mais de {panorama.limiteSobrecarga} itens como responsável.
              </p>
            )}
          </div>
        </div>
      </div>

      <Secao
        titulo="Responsável por"
        total={carga.responsavel.length}
        vazio={`${euMesmo ? "Você não é" : "Não é"} responsável por nenhum item.`}
      >
        <ItensPorFrente itens={carga.responsavel} frentes={frentes} />
      </Secao>

      <Secao
        titulo="Apoio em"
        total={carga.apoio.length}
        vazio={`${euMesmo ? "Você não está" : "Não está"} como apoio em nenhum item.`}
      >
        <ItensPorFrente itens={carga.apoio} frentes={frentes} />
      </Secao>

      <Secao titulo="Tarefas" total={tarefas.length} vazio="Nenhuma tarefa atribuída.">
        <ListaTarefas tarefas={tarefas} itens={itensPorId} />
      </Secao>

      <Secao
        titulo="Decisões abertas nos itens em que é responsável"
        total={decisoes.length}
        vazio="Nenhuma decisão em aberto."
      >
        <ListaDecisoes decisoes={decisoes} itens={itensPorId} />
      </Secao>
    </div>
  );
}
