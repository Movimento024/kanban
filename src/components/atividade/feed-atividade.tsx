"use client";

import { useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TZDate } from "@date-fns/tz";
import { FilterX, History, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AvatarPessoa } from "@/components/comum/avatar-pessoa";
import { EstadoVazio } from "@/components/comum/estado-vazio";
import { ChipFrente } from "@/components/frentes/chip-frente";
import { useAbrirItem } from "@/components/itens/use-abrir-item";
import { fraseAtividade, haQuanto, quando } from "@/lib/atividade/frases";
import { PERIODOS_ATIVIDADE, TIPOS_ACAO, type FiltrosAtividade } from "@/lib/atividade/filtros";
import { FUSO, hoje } from "@/lib/datas";
import { cn } from "@/lib/utils";
import { carregarMaisAtividades } from "@/server/actions/atividades";
import type { AtividadeFeed } from "@/server/consultas/atividades";
import type { Frente } from "@/server/consultas/frentes";

const TODOS = "todos";

type Opcao = { valor: string; rotulo: string };

function Filtro({
  rotulo,
  valor,
  opcoes,
  todos,
  aoMudar,
}: {
  rotulo: string;
  valor: string | undefined;
  opcoes: Opcao[];
  todos: string;
  aoMudar: (v: string | undefined) => void;
}) {
  return (
    <Select value={valor ?? TODOS} onValueChange={(v) => aoMudar(v === TODOS ? undefined : v)}>
      <SelectTrigger
        aria-label={rotulo}
        className={cn("h-10 w-full md:h-9", valor && "border-primary/60")}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={TODOS}>{todos}</SelectItem>
        {opcoes.map((o) => (
          <SelectItem key={o.valor} value={o.valor}>
            {o.rotulo}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** "Hoje", "Ontem", "sexta-feira, 9 de outubro". */
function rotuloDia(dia: string, hojeIso: string, ontemIso: string): string {
  if (dia === hojeIso) return "Hoje";
  if (dia === ontemIso) return "Ontem";
  const d = new Date(`${dia}T12:00:00`);
  const texto = format(
    d,
    d.getFullYear() === new Date(`${hojeIso}T12:00:00`).getFullYear()
      ? "EEEE, d 'de' MMMM"
      : "EEEE, d 'de' MMMM 'de' yyyy",
    { locale: ptBR },
  );
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

const diaEmSP = (iso: string) => format(new TZDate(iso, FUSO), "yyyy-MM-dd");

export function FeedAtividade({
  iniciais,
  temMaisInicial,
  filtros,
  pessoas,
  frentes,
}: {
  iniciais: AtividadeFeed[];
  temMaisInicial: boolean;
  filtros: FiltrosAtividade;
  pessoas: { id: string; nome: string }[];
  frentes: Frente[];
}) {
  const router = useRouter();
  const caminho = usePathname();
  const params = useSearchParams();
  const { abrir } = useAbrirItem();
  const [filtrando, iniciarFiltro] = useTransition();
  const [carregando, iniciarCarga] = useTransition();
  const [mais, setMais] = useState<{ lista: AtividadeFeed[]; temMais: boolean } | null>(null);

  // Primeira página vem do servidor (e se atualiza em tempo real); as seguintes, daqui.
  const atividades = useMemo(() => {
    if (!mais) return iniciais;
    const ids = new Set(iniciais.map((a) => a.id));
    return [...iniciais, ...mais.lista.filter((a) => !ids.has(a.id))];
  }, [iniciais, mais]);
  const temMais = mais ? mais.temMais : temMaisInicial;

  const frentesPorId = useMemo(() => new Map(frentes.map((f) => [f.id, f])), [frentes]);

  const mudar = (chave: keyof FiltrosAtividade, valor: string | undefined) => {
    const p = new URLSearchParams(params);
    if (valor) p.set(chave, valor);
    else p.delete(chave);
    p.delete("item");
    const qs = p.toString();
    iniciarFiltro(() => router.replace(qs ? `${caminho}?${qs}` : caminho, { scroll: false }));
  };
  const temFiltro = Object.values(filtros).some(Boolean);

  const carregarMais = () => {
    const ultimo = atividades.at(-1);
    if (!ultimo) return;
    iniciarCarga(async () => {
      const r = await carregarMaisAtividades(filtros, ultimo.id);
      if (!r.ok) {
        toast.error(r.erro);
        return;
      }
      setMais((m) => ({
        lista: [...(m?.lista ?? []), ...r.data.atividades],
        temMais: r.data.temMais,
      }));
    });
  };

  const grupos = useMemo(() => {
    const base = hoje();
    const hojeIso = format(base, "yyyy-MM-dd");
    const ontem = new Date(base);
    ontem.setDate(ontem.getDate() - 1);
    const ontemIso = format(ontem, "yyyy-MM-dd");
    const mapa = new Map<string, AtividadeFeed[]>();
    for (const a of atividades) {
      const dia = diaEmSP(a.created_at);
      mapa.set(dia, [...(mapa.get(dia) ?? []), a]);
    }
    return [...mapa].map(([dia, lista]) => ({
      dia,
      rotulo: rotuloDia(dia, hojeIso, ontemIso),
      lista,
    }));
  }, [atividades]);

  return (
    <div className="grid gap-5">
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto]">
        <Filtro
          rotulo="Pessoa"
          todos="Todas as pessoas"
          valor={filtros.pessoa}
          opcoes={pessoas.map((p) => ({ valor: p.id, rotulo: p.nome }))}
          aoMudar={(v) => mudar("pessoa", v)}
        />
        <Filtro
          rotulo="Frente"
          todos="Todas as frentes"
          valor={filtros.frente}
          opcoes={frentes.map((f) => ({
            valor: f.id,
            rotulo: f.archived_at ? `${f.nome} (arquivada)` : f.nome,
          }))}
          aoMudar={(v) => mudar("frente", v)}
        />
        <Filtro
          rotulo="Tipo de ação"
          todos="Todas as ações"
          valor={filtros.tipo}
          opcoes={Object.entries(TIPOS_ACAO).map(([valor, t]) => ({ valor, rotulo: t.rotulo }))}
          aoMudar={(v) => mudar("tipo", v)}
        />
        <Filtro
          rotulo="Período"
          todos="Desde o início"
          valor={filtros.periodo}
          opcoes={Object.entries(PERIODOS_ATIVIDADE).map(([valor, rotulo]) => ({ valor, rotulo }))}
          aoMudar={(v) => mudar("periodo", v)}
        />
        {temFiltro && (
          <Button
            variant="ghost"
            className="col-span-2 justify-self-start lg:col-span-1"
            onClick={() => iniciarFiltro(() => router.replace(caminho, { scroll: false }))}
          >
            <FilterX aria-hidden /> Limpar filtros
          </Button>
        )}
      </div>

      <div
        className={cn("grid gap-6 transition-opacity", filtrando && "opacity-50")}
        aria-busy={filtrando}
      >
        {atividades.length === 0 ? (
          <EstadoVazio
            icone={History}
            titulo={temFiltro ? "Nada encontrado com esses filtros" : "Nenhuma atividade ainda"}
            descricao={
              temFiltro
                ? "Tente outro período ou tire algum filtro."
                : "Tudo o que for criado, editado ou atribuído aparece aqui."
            }
          />
        ) : (
          grupos.map((g) => (
            <section key={g.dia} className="grid gap-2" aria-labelledby={`dia-${g.dia}`}>
              <h2
                id={`dia-${g.dia}`}
                className="bg-background/95 sticky top-[6.25rem] z-10 -mx-1 px-1 py-1 text-sm font-semibold backdrop-blur"
              >
                {g.rotulo}
              </h2>
              <ol className="grid gap-1">
                {g.lista.map((a) => {
                  const frente = a.frente_id ? frentesPorId.get(a.frente_id) : undefined;
                  const itemSumiu = a.entidade === "item" && a.acao === "excluiu";
                  const abrivel = !!a.item_id && !itemSumiu;
                  const conteudo = (
                    <>
                      {a.ator ? (
                        <AvatarPessoa
                          nome={a.ator.nome}
                          iniciais={a.ator.iniciais}
                          regiao={a.ator.regiao}
                          ativo={a.ator.ativo}
                          tamanho="sm"
                          className="mt-0.5"
                        />
                      ) : (
                        <span
                          className="bg-muted mt-0.5 size-6 shrink-0 rounded-full"
                          aria-hidden
                        />
                      )}
                      <span className="grid min-w-0 flex-1 gap-0.5">
                        <span className="text-sm">{fraseAtividade(a)}</span>
                        <span className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                          <time dateTime={a.created_at} title={quando(a.created_at)}>
                            {format(new TZDate(a.created_at, FUSO), "HH:mm")} ·{" "}
                            {haQuanto(a.created_at)}
                          </time>
                          {frente && <ChipFrente frente={frente} className="py-0" />}
                        </span>
                      </span>
                    </>
                  );
                  return (
                    <li key={a.id}>
                      {abrivel ? (
                        <button
                          type="button"
                          onClick={() => abrir(a.item_id!)}
                          className="hover:bg-muted/60 focus-visible:ring-ring flex w-full items-start gap-3 rounded-lg px-2 py-2 text-left focus-visible:ring-2 focus-visible:outline-none"
                        >
                          {conteudo}
                        </button>
                      ) : (
                        <div className="flex items-start gap-3 px-2 py-2">{conteudo}</div>
                      )}
                    </li>
                  );
                })}
              </ol>
            </section>
          ))
        )}

        {temMais && (
          <Button
            variant="outline"
            className="justify-self-center"
            onClick={carregarMais}
            disabled={carregando}
          >
            {carregando && <Loader2 className="animate-spin" aria-hidden />}
            Carregar mais
          </Button>
        )}
      </div>
    </div>
  );
}
