"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { AlertTriangle, Search, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AvatarPessoa } from "@/components/comum/avatar-pessoa";
import { Segmentado } from "@/components/comum/segmentado";
import { EstadoVazio } from "@/components/comum/estado-vazio";
import { ROTULO_REGIAO_PESSOA } from "@/lib/constantes";
import { CARGA_VAZIA, pessoaNaRegiao, type Carga, type FiltroRegiaoPessoa } from "@/lib/panorama";
import { cn } from "@/lib/utils";
import { definirLimiteSobrecarga } from "@/server/actions/lideres";
import type { PessoaResumo } from "@/server/consultas/itens";

const FILTROS: { valor: FiltroRegiaoPessoa; rotulo: string }[] = [
  { valor: "todos", rotulo: "Todos" },
  { valor: "SP", rotulo: "SP" },
  { valor: "Nordeste", rotulo: "Nordeste" },
];

function ConfigLimite({ limite }: { limite: number }) {
  const [valor, setValor] = useState(String(limite));
  const [aberto, setAberto] = useState(false);
  const [pendente, iniciar] = useTransition();

  return (
    <Popover
      open={aberto}
      onOpenChange={(o) => {
        setAberto(o);
        if (o) setValor(String(limite));
      }}
    >
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          <Settings2 aria-hidden /> Limite: {limite}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="grid w-72 gap-3">
        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            iniciar(async () => {
              const r = await definirLimiteSobrecarga(Number(valor));
              if (r.ok) {
                toast.success(r.mensagem);
                setAberto(false);
              } else toast.error(r.erro);
            });
          }}
        >
          <label htmlFor="limite-sobrecarga" className="text-sm font-medium">
            Sobrecarregado acima de quantos itens como responsável?
          </label>
          <div className="flex gap-2">
            <Input
              id="limite-sobrecarga"
              type="number"
              min={1}
              max={50}
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              className="w-24"
            />
            <Button type="submit" disabled={pendente}>
              Salvar
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}

export function GradeLideres({
  pessoas,
  cargas,
  limite,
  eAdmin,
}: {
  pessoas: PessoaResumo[];
  cargas: Map<string, Carga>;
  limite: number;
  eAdmin: boolean;
}) {
  const [regiao, setRegiao] = useState<FiltroRegiaoPessoa>("todos");
  const [busca, setBusca] = useState("");

  const visiveis = useMemo(() => {
    const termo = busca
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .trim();
    return pessoas.filter(
      (p) =>
        pessoaNaRegiao(p.regiao, regiao) &&
        (!termo ||
          p.nome
            .normalize("NFD")
            .replace(/\p{Diacritic}/gu, "")
            .toLowerCase()
            .includes(termo)),
    );
  }, [pessoas, regiao, busca]);

  const semNada = visiveis.filter((p) => {
    const c = cargas.get(p.id);
    return !c || (!c.responsavel.length && !c.apoio.length);
  }).length;
  const sobrecarregados = visiveis.filter(
    (p) => (cargas.get(p.id)?.responsavel.length ?? 0) > limite,
  ).length;

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Segmentado rotulo="Região" opcoes={FILTROS} valor={regiao} aoMudar={setRegiao} />
        <div className="relative min-w-48 flex-1 sm:max-w-xs">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
            aria-hidden
          />
          <Input
            type="search"
            placeholder="Buscar por nome"
            aria-label="Buscar por nome"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="h-10 pl-8 md:h-9"
          />
        </div>
        <span className="flex-1" />
        {eAdmin && <ConfigLimite limite={limite} />}
      </div>

      <p className="text-muted-foreground text-sm">
        {visiveis.length} {visiveis.length === 1 ? "pessoa" : "pessoas"}
        {semNada > 0 && ` · ${semNada} sem nenhuma responsabilidade`}
        {sobrecarregados > 0 &&
          ` · ${sobrecarregados} ${sobrecarregados === 1 ? "sobrecarregada" : "sobrecarregadas"} (mais de ${limite} itens como responsável)`}
      </p>

      {visiveis.length === 0 ? (
        <EstadoVazio titulo="Ninguém encontrado" descricao="Tente outro nome ou outra região." />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visiveis.map((p) => {
            const c = cargas.get(p.id) ?? CARGA_VAZIA;
            const nenhuma = !c.responsavel.length && !c.apoio.length;
            const sobrecarga = c.responsavel.length > limite;
            return (
              <li key={p.id}>
                <Link
                  href={`/lideres/${p.id}`}
                  className={cn(
                    "bg-card focus-visible:ring-ring flex h-full items-center gap-3 rounded-xl border p-3 shadow-xs transition hover:shadow-md focus-visible:ring-2 focus-visible:outline-none",
                    nenhuma && "border-dashed border-amber-500/60 bg-amber-500/5",
                    sobrecarga && "border-red-500/60 bg-red-500/5",
                  )}
                >
                  <AvatarPessoa
                    nome={p.nome}
                    iniciais={p.iniciais}
                    regiao={p.regiao}
                    tamanho="lg"
                  />
                  <span className="grid min-w-0 flex-1 gap-0.5">
                    <span className="truncate font-medium">{p.nome}</span>
                    <span className="text-muted-foreground text-xs">
                      {ROTULO_REGIAO_PESSOA[p.regiao]}
                    </span>
                    {nenhuma ? (
                      <span className="text-xs font-medium text-amber-800 dark:text-amber-300">
                        Sem nenhuma responsabilidade
                      </span>
                    ) : (
                      <span className="text-xs">
                        <strong className={cn(sobrecarga && "text-red-700 dark:text-red-300")}>
                          {c.responsavel.length}
                        </strong>{" "}
                        responsável · <strong>{c.apoio.length}</strong> apoio
                        {c.tarefasAbertas > 0 && (
                          <>
                            {" "}
                            · <strong>{c.tarefasAbertas}</strong>{" "}
                            {c.tarefasAbertas === 1 ? "tarefa" : "tarefas"}
                          </>
                        )}
                      </span>
                    )}
                    {sobrecarga && (
                      <span className="flex items-center gap-1 text-xs font-medium text-red-700 dark:text-red-300">
                        <AlertTriangle className="size-3" aria-hidden /> Sobrecarregado
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
