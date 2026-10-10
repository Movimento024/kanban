"use client";

import { useState } from "react";
import {
  CalendarClock,
  CircleCheck,
  CircleDot,
  ListPlus,
  MapPin,
  MoreHorizontal,
  RotateCcw,
  UserMinus,
  UserPlus,
  UserRoundCheck,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { AvatarPessoa } from "@/components/comum/avatar-pessoa";
import { usePainel } from "@/components/painel/contexto-painel";
import { MenuRamo } from "@/components/painel/menu-ramo";
import { SeletorPessoa } from "@/components/painel/seletor-pessoa";
import { TextoEditavel } from "@/components/painel/texto-editavel";
import { haQuanto, quando } from "@/lib/atividade/frases";
import { format } from "date-fns";
import { hojeIso, paraData } from "@/lib/datas";
import { cn } from "@/lib/utils";
import {
  atribuirPessoa,
  decidir,
  definirLocalItem,
  desatribuirPessoa,
  editarDecisao,
  editarNota,
  editarOpcao,
  editarTarefa,
} from "@/server/actions/ramos";
import type {
  Atribuicao,
  Decisao,
  DetalheItem,
  Nota,
  Opcao,
  Tarefa,
} from "@/server/consultas/detalhe-item";

// ---------------------------------------------------------------
// Atualizações otimistas
// ---------------------------------------------------------------

const comTarefa = (id: string, patch: Partial<Tarefa>) => (d: DetalheItem) => ({
  ...d,
  tarefas: d.tarefas.map((t) => (t.id === id ? { ...t, ...patch } : t)),
});
const comDecisao = (id: string, patch: Partial<Decisao>) => (d: DetalheItem) => ({
  ...d,
  decisoes: d.decisoes.map((x) => (x.id === id ? { ...x, ...patch } : x)),
});

// ---------------------------------------------------------------
// Prazo (tarefas e decisões)
// ---------------------------------------------------------------

function ChipPrazo({ prazo, concluido }: { prazo: string; concluido?: boolean }) {
  const atrasado = !concluido && prazo < hojeIso();
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-0.5 rounded px-1 text-[11px] tabular-nums",
        atrasado
          ? "bg-red-500/15 font-medium text-red-700 dark:text-red-300"
          : "text-muted-foreground",
      )}
      title={atrasado ? "Atrasado" : "Prazo"}
    >
      <CalendarClock className="size-3" aria-hidden />
      {format(paraData(prazo), "dd/MM")}
      {atrasado && <span className="sr-only"> (atrasado)</span>}
    </span>
  );
}

function CampoPrazo({
  valor,
  aoSalvar,
  aoFechar,
}: {
  valor: string | null;
  aoSalvar: (v: string | null) => void;
  aoFechar: () => void;
}) {
  return (
    <span className="nodrag nopan flex items-center gap-1 text-xs">
      <input
        type="date"
        autoFocus
        defaultValue={valor ?? ""}
        aria-label="Prazo"
        className="bg-background rounded border px-1 py-0.5"
        onKeyDown={(e) => e.key === "Escape" && aoFechar()}
        onBlur={(e) => {
          const v = e.target.value || null;
          if (v !== valor) aoSalvar(v);
          aoFechar();
        }}
      />
    </span>
  );
}

// ---------------------------------------------------------------
// Líderes
// ---------------------------------------------------------------

export function LinhaPessoa({ atribuicao }: { atribuicao: Atribuicao }) {
  const { detalhe, executar } = usePainel();
  const { pessoa, papel } = atribuicao;
  const itemId = detalhe.item.id;
  const responsavel = papel === "responsavel";

  return (
    <div className="flex min-w-0 items-center gap-2">
      <AvatarPessoa
        nome={pessoa.nome}
        iniciais={pessoa.iniciais}
        regiao={pessoa.regiao}
        ativo={pessoa.ativo}
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{pessoa.nome}</span>
        <span
          className={cn(
            "block text-xs",
            responsavel ? "text-foreground/80 font-medium" : "text-muted-foreground",
          )}
        >
          {responsavel ? "Responsável" : "Apoio"}
          {!pessoa.ativo && " · inativo"}
        </span>
      </span>
      {/* Pessoas não são arquivadas: tirar do item é permitido a todos. */}
      <MenuGenerico rotulo={`Mais ações: ${pessoa.nome}`}>
        {responsavel ? (
          <DropdownMenuItem
            onSelect={() => executar(() => atribuirPessoa(itemId, pessoa.id, "apoio"))}
          >
            <Users aria-hidden /> Passar para apoio
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onSelect={() => executar(() => atribuirPessoa(itemId, pessoa.id, "responsavel"))}
          >
            <UserRoundCheck aria-hidden /> Tornar responsável
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          variant="destructive"
          onSelect={() =>
            executar(
              () => desatribuirPessoa(itemId, pessoa.id),
              (d) => ({ ...d, atribuicoes: d.atribuicoes.filter((a) => a.id !== atribuicao.id) }),
            )
          }
        >
          <UserMinus aria-hidden /> Tirar do item
        </DropdownMenuItem>
      </MenuGenerico>
    </div>
  );
}

function MenuGenerico({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-xs"
          className="nodrag nopan text-muted-foreground shrink-0"
          aria-label={rotulo}
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Botão para adicionar pessoa: sem responsável → entra como responsável; senão, apoio. */
export function AdicionarPessoa({ className }: { className?: string }) {
  const { detalhe, executar } = usePainel();
  const temResponsavel = detalhe.atribuicoes.some((a) => a.papel === "responsavel");
  const naoAtribuidos = detalhe.pessoas.filter(
    (p) => !detalhe.atribuicoes.some((a) => a.pessoa.id === p.id),
  );
  return (
    <SeletorPessoa
      pessoas={naoAtribuidos}
      titulo={temResponsavel ? "Adicionar como apoio" : "Adicionar como responsável"}
      aoEscolher={(p) =>
        p &&
        executar(() =>
          atribuirPessoa(detalhe.item.id, p.id, temResponsavel ? "apoio" : "responsavel"),
        )
      }
    >
      <button
        type="button"
        className={cn(
          "nodrag nopan text-muted-foreground hover:text-foreground focus-visible:ring-ring flex items-center gap-1.5 rounded-md border border-dashed px-2 py-1.5 text-sm hover:border-solid focus-visible:ring-2 focus-visible:outline-none",
          className,
        )}
      >
        <UserPlus className="size-4" aria-hidden />
        {temResponsavel ? "Adicionar apoio" : "Adicionar responsável"}
      </button>
    </SeletorPessoa>
  );
}

// ---------------------------------------------------------------
// Tarefas
// ---------------------------------------------------------------

export function LinhaTarefa({
  tarefa,
  aoAdicionarSubtarefa,
}: {
  tarefa: Tarefa;
  /** Só tarefas de primeiro nível podem ter subtarefas. */
  aoAdicionarSubtarefa?: () => void;
}) {
  const { detalhe, executar } = usePainel();
  const [editandoPrazo, setEditandoPrazo] = useState(false);
  const responsavel = detalhe.pessoas.find((p) => p.id === tarefa.responsavel_id);

  const salvar = (
    patch: Partial<Pick<Tarefa, "titulo" | "concluida" | "responsavel_id" | "prazo">>,
  ) => executar(() => editarTarefa(tarefa.id, patch), comTarefa(tarefa.id, patch));

  return (
    <div className="flex min-w-0 items-center gap-2">
      <Checkbox
        className="nodrag nopan"
        checked={tarefa.concluida}
        onCheckedChange={(v) => salvar({ concluida: v === true })}
        onClick={(e) => e.stopPropagation()}
        aria-label={`${tarefa.concluida ? "Reabrir" : "Concluir"} “${tarefa.titulo}”`}
      />
      <TextoEditavel
        valor={tarefa.titulo}
        rotulo="Tarefa"
        maxLength={200}
        aoSalvar={(titulo) => salvar({ titulo })}
        className="flex-1 text-sm"
        classeTexto={tarefa.concluida ? "text-muted-foreground line-through" : undefined}
      />
      {editandoPrazo ? (
        <CampoPrazo
          valor={tarefa.prazo}
          aoSalvar={(prazo) => salvar({ prazo })}
          aoFechar={() => setEditandoPrazo(false)}
        />
      ) : (
        tarefa.prazo && <ChipPrazo prazo={tarefa.prazo} concluido={tarefa.concluida} />
      )}
      <SeletorPessoa
        pessoas={detalhe.pessoas}
        selecionados={tarefa.responsavel_id ? [tarefa.responsavel_id] : []}
        permitirNinguem
        titulo="Quem cuida desta tarefa"
        aoEscolher={(p) => salvar({ responsavel_id: p?.id ?? null })}
      >
        <button
          type="button"
          className="nodrag nopan focus-visible:ring-ring shrink-0 rounded-full focus-visible:ring-2 focus-visible:outline-none"
          aria-label={
            responsavel ? `Responsável: ${responsavel.nome}. Trocar` : "Definir quem cuida"
          }
          onClick={(e) => e.stopPropagation()}
        >
          {responsavel ? (
            <AvatarPessoa
              nome={responsavel.nome}
              iniciais={responsavel.iniciais}
              regiao={responsavel.regiao}
              tamanho="sm"
            />
          ) : (
            <span className="text-muted-foreground flex size-6 items-center justify-center rounded-full border border-dashed">
              <UserPlus className="size-3" aria-hidden />
            </span>
          )}
        </button>
      </SeletorPessoa>
      <MenuRamo tabela="tarefas" id={tarefa.id} nome={tarefa.titulo}>
        <DropdownMenuItem onSelect={() => setEditandoPrazo(true)}>
          <CalendarClock aria-hidden /> {tarefa.prazo ? "Mudar prazo" : "Definir prazo"}
        </DropdownMenuItem>
        {tarefa.prazo && (
          <DropdownMenuItem onSelect={() => salvar({ prazo: null })}>
            <RotateCcw aria-hidden /> Tirar prazo
          </DropdownMenuItem>
        )}
        {aoAdicionarSubtarefa && (
          <DropdownMenuItem onSelect={aoAdicionarSubtarefa}>
            <ListPlus aria-hidden /> Adicionar subtarefa
          </DropdownMenuItem>
        )}
      </MenuRamo>
    </div>
  );
}

// ---------------------------------------------------------------
// Decisões e opções
// ---------------------------------------------------------------

export function CabecalhoDecisao({ decisao }: { decisao: Decisao }) {
  const { executar } = usePainel();
  const [editandoPrazo, setEditandoPrazo] = useState(false);
  const escolhida = decisao.opcoes.find((o) => o.id === decisao.opcao_escolhida_id);
  const salvar = (patch: Parameters<typeof editarDecisao>[1]) =>
    executar(() => editarDecisao(decisao.id, patch), comDecisao(decisao.id, patch));

  return (
    <div className="grid min-w-0 gap-0.5">
      <div className="flex min-w-0 items-center gap-1.5">
        {decisao.status === "decidida" ? (
          <CircleCheck className="size-4 shrink-0 text-green-600" aria-label="Decidida" />
        ) : (
          <CircleDot className="size-4 shrink-0 text-amber-500" aria-label="Aberta" />
        )}
        <TextoEditavel
          valor={decisao.pergunta}
          rotulo="Pergunta da decisão"
          aoSalvar={(pergunta) => salvar({ pergunta })}
          className="flex-1 text-sm font-medium"
        />
        {editandoPrazo ? (
          <CampoPrazo
            valor={decisao.prazo}
            aoSalvar={(prazo) => salvar({ prazo })}
            aoFechar={() => setEditandoPrazo(false)}
          />
        ) : (
          decisao.prazo && (
            <ChipPrazo prazo={decisao.prazo} concluido={decisao.status === "decidida"} />
          )
        )}
        <MenuRamo tabela="decisoes" id={decisao.id} nome={decisao.pergunta}>
          <DropdownMenuItem onSelect={() => setEditandoPrazo(true)}>
            <CalendarClock aria-hidden />{" "}
            {decisao.prazo ? "Mudar prazo para decidir" : "Prazo para decidir"}
          </DropdownMenuItem>
          {decisao.status === "decidida" && (
            <DropdownMenuItem onSelect={() => executar(() => decidir(decisao.id, null))}>
              <RotateCcw aria-hidden /> Reabrir decisão
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">
            Ao decidir, oferecer atualizar
          </DropdownMenuLabel>
          <DropdownMenuRadioGroup
            value={decisao.campo_relacionado ?? "nada"}
            onValueChange={(v) =>
              salvar({ campo_relacionado: v === "nada" ? null : (v as "local" | "data") })
            }
          >
            <DropdownMenuRadioItem value="local">o local do item</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="data">a data do item</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="nada">nada</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </MenuRamo>
      </div>
      <span className="text-muted-foreground pl-5.5 text-xs">
        {decisao.status === "decidida"
          ? `Decidida: ${escolhida?.texto ?? "—"}`
          : decisao.opcoes.length
            ? `Aberta · ${decisao.opcoes.length} ${decisao.opcoes.length === 1 ? "opção" : "opções"}`
            : "Aberta · sem opções ainda"}
      </span>
    </div>
  );
}

export function LinhaOpcao({ decisao, opcao }: { decisao: Decisao; opcao: Opcao }) {
  const { detalhe, executar, abrirDetalhes } = usePainel();
  const escolhida = decisao.opcao_escolhida_id === opcao.id;

  async function escolher() {
    const ok = await executar(
      () => decidir(decisao.id, escolhida ? null : opcao.id),
      comDecisao(
        decisao.id,
        escolhida
          ? { status: "aberta", opcao_escolhida_id: null }
          : { status: "decidida", opcao_escolhida_id: opcao.id },
      ),
    );
    if (!ok || escolhida) return;

    // Oferece atualizar o campo do item ligado à decisão.
    if (decisao.campo_relacionado === "local" && detalhe.item.local !== opcao.texto) {
      toast(`Usar “${opcao.texto}” como local do item?`, {
        duration: 10000,
        action: {
          label: "Atualizar local",
          onClick: () => executar(() => definirLocalItem(detalhe.item.id, opcao.texto)),
        },
      });
    } else if (decisao.campo_relacionado === "data") {
      toast("Quer ajustar a data do item conforme a decisão?", {
        duration: 10000,
        action: { label: "Ajustar data", onClick: abrirDetalhes },
      });
    }
  }

  return (
    <div className="flex min-w-0 items-center gap-2">
      <button
        type="button"
        role="radio"
        aria-checked={escolhida}
        onClick={(e) => {
          e.stopPropagation();
          void escolher();
        }}
        className={cn(
          "nodrag nopan focus-visible:ring-ring flex size-4 shrink-0 items-center justify-center rounded-full border-2 focus-visible:ring-2 focus-visible:outline-none",
          escolhida
            ? "border-green-600 bg-green-600"
            : "border-muted-foreground/50 hover:border-foreground",
        )}
        aria-label={
          escolhida ? `Desmarcar “${opcao.texto}” (reabre a decisão)` : `Escolher “${opcao.texto}”`
        }
      >
        {escolhida && <span className="size-1.5 rounded-full bg-white" />}
      </button>
      <TextoEditavel
        valor={opcao.texto}
        rotulo="Opção"
        maxLength={200}
        aoSalvar={(texto) => executar(() => editarOpcao(opcao.id, texto))}
        className={cn(
          "flex-1 text-sm",
          escolhida && "font-medium text-green-700 dark:text-green-400",
        )}
      />
      {escolhida && decisao.campo_relacionado === "local" && detalhe.item.local !== opcao.texto && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            void executar(() => definirLocalItem(detalhe.item.id, opcao.texto));
          }}
          className="nodrag nopan text-muted-foreground hover:bg-muted hover:text-foreground flex shrink-0 items-center gap-0.5 rounded px-1 text-[11px]"
          title="Usar como local do item"
        >
          <MapPin className="size-3" aria-hidden /> usar como local
        </button>
      )}
      <MenuRamo tabela="decisao_opcoes" id={opcao.id} nome={opcao.texto} />
    </div>
  );
}

// ---------------------------------------------------------------
// Notas
// ---------------------------------------------------------------

export function LinhaNota({ nota, compacta = false }: { nota: Nota; compacta?: boolean }) {
  const { executar } = usePainel();
  return (
    <div className="flex min-w-0 gap-2">
      {nota.autor && (
        <AvatarPessoa
          nome={nota.autor.nome}
          iniciais={nota.autor.iniciais}
          regiao={nota.autor.regiao}
          tamanho="sm"
          className="mt-0.5"
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
          <span className="text-foreground truncate font-medium">
            {nota.autor?.nome ?? "Sistema"}
          </span>
          <time dateTime={nota.created_at} title={quando(nota.created_at)} className="shrink-0">
            {haQuanto(nota.created_at)}
          </time>
          {nota.updated_at !== nota.created_at && <span className="shrink-0">· editada</span>}
          <span className="flex-1" />
          <MenuRamo tabela="notas" id={nota.id} nome="esta nota" />
        </div>
        <TextoEditavel
          valor={nota.texto}
          rotulo="Nota"
          multilinha
          maxLength={4000}
          aoSalvar={(texto) => executar(() => editarNota(nota.id, texto))}
          className={cn("w-full text-sm", compacta && "line-clamp-2")}
        />
      </div>
    </div>
  );
}
