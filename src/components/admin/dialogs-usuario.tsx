"use client";

import { useActionState, useEffect, useState } from "react";
import { Loader2, Wand2 } from "lucide-react";
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
import {
  PAPEIS,
  REGIOES_PESSOA,
  ROTULO_PAPEL,
  ROTULO_REGIAO_PESSOA,
  SENHA_MINIMA,
  type Papel,
  type RegiaoPessoa,
} from "@/lib/constantes";
import { criarUsuario, editarUsuario, redefinirSenha } from "@/server/actions/usuarios";
import type { Resultado } from "@/server/resultado";
import type { Perfil } from "@/server/sessao";

/** Senha legível, sem caracteres ambíguos (0/O, 1/l/I), para mandar por mensagem. */
function gerarSenha() {
  const alfabeto = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint32Array(12));
  const s = Array.from(bytes, (b) => alfabeto[b % alfabeto.length]).join("");
  return `${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8)}`;
}

/** Fecha o diálogo e avisa quando a action dá certo. */
function useAoConcluir(estado: Resultado | null, aoFechar: () => void) {
  useEffect(() => {
    if (estado?.ok) {
      toast.success(estado.mensagem ?? "Feito.");
      aoFechar();
    }
  }, [estado, aoFechar]);
}

function CampoSenhaInicial({ erro, rotulo }: { erro?: string; rotulo: string }) {
  const [senha, setSenha] = useState("");
  return (
    <div className="grid gap-1.5">
      <div className="flex items-end gap-2">
        <Campo
          className="flex-1"
          rotulo={rotulo}
          name="senha"
          type="text"
          autoComplete="off"
          spellCheck={false}
          required
          minLength={SENHA_MINIMA}
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          erro={erro}
        />
        <Button
          type="button"
          variant="outline"
          className="h-10 md:h-9"
          onClick={() => setSenha(gerarSenha())}
        >
          <Wand2 aria-hidden /> Gerar
        </Button>
      </div>
      {!erro && (
        <p className="text-muted-foreground text-xs">
          Envie essa senha para a pessoa. No primeiro acesso ela será obrigada a trocar.
        </p>
      )}
    </div>
  );
}

function FormUsuario({
  perfil,
  eMeuPerfil,
  aoFechar,
}: {
  perfil?: Perfil;
  eMeuPerfil: boolean;
  aoFechar: () => void;
}) {
  const [estado, acao, pendente] = useActionState(perfil ? editarUsuario : criarUsuario, null);
  const [erros, limparErro] = useErrosCampos(estado);
  useAoConcluir(estado, aoFechar);

  // Controlados: o React limpa o form após a action e os dados não podem sumir em caso de erro.
  const [nome, setNome] = useState(perfil?.nome ?? "");
  const [email, setEmail] = useState(perfil?.email ?? "");
  const [regiao, setRegiao] = useState<RegiaoPessoa | "">(perfil?.regiao ?? "");
  const [papel, setPapel] = useState<Papel>(perfil?.papel ?? "lider");

  return (
    <form onSubmit={enviarSemResetar(acao)} onChange={limparErro} className="grid gap-4" noValidate>
      {estado && !estado.ok && !estado.campos && <MensagemErro>{estado.erro}</MensagemErro>}
      {perfil && <input type="hidden" name="id" value={perfil.id} />}
      <Campo
        rotulo="Nome completo"
        name="nome"
        required
        autoFocus
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        erro={erros?.nome}
      />
      <Campo
        rotulo="E-mail"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="off"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        erro={erros?.email}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="campo-regiao">Região</Label>
          <Select name="regiao" value={regiao} onValueChange={(v) => setRegiao(v as RegiaoPessoa)}>
            <SelectTrigger
              id="campo-regiao"
              className="h-10 w-full md:h-9"
              aria-invalid={erros?.regiao ? true : undefined}
            >
              <SelectValue placeholder="Escolha" />
            </SelectTrigger>
            <SelectContent>
              {REGIOES_PESSOA.map((r) => (
                <SelectItem key={r} value={r}>
                  {ROTULO_REGIAO_PESSOA[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {erros?.regiao && <p className="text-destructive text-xs">{erros.regiao}</p>}
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="campo-papel">Papel</Label>
          <Select
            name="papel"
            value={papel}
            onValueChange={(v) => setPapel(v as Papel)}
            disabled={eMeuPerfil}
          >
            <SelectTrigger id="campo-papel" className="h-10 w-full md:h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAPEIS.map((p) => (
                <SelectItem key={p} value={p}>
                  {ROTULO_PAPEL[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* Select desabilitado não envia valor */}
          {eMeuPerfil && <input type="hidden" name="papel" value={papel} />}
          <p className="text-muted-foreground text-xs">
            {eMeuPerfil
              ? "Você não pode mudar o seu próprio papel."
              : papel === "admin"
                ? "Pode tudo, inclusive arquivar e excluir."
                : "Pode tudo, exceto arquivar e excluir."}
          </p>
        </div>
      </div>
      {!perfil && <CampoSenhaInicial rotulo="Senha inicial" erro={erros?.senha} />}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={aoFechar} disabled={pendente}>
          Cancelar
        </Button>
        <Button type="submit" disabled={pendente}>
          {pendente && <Loader2 className="animate-spin" aria-hidden />}
          {perfil ? "Salvar" : "Criar conta"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function DialogUsuario({
  aberto,
  perfil,
  eMeuPerfil,
  aoFechar,
}: {
  aberto: boolean;
  perfil?: Perfil;
  eMeuPerfil: boolean;
  aoFechar: () => void;
}) {
  return (
    <Dialog open={aberto} onOpenChange={(o) => !o && aoFechar()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{perfil ? `Editar ${perfil.nome}` : "Novo usuário"}</DialogTitle>
          <DialogDescription>
            {perfil
              ? "Altere os dados da conta."
              : "Crie a conta e envie o e-mail e a senha inicial para a pessoa."}
          </DialogDescription>
        </DialogHeader>
        {aberto && (
          <FormUsuario
            key={perfil?.id ?? "novo"}
            perfil={perfil}
            eMeuPerfil={eMeuPerfil}
            aoFechar={aoFechar}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function FormRedefinirSenha({ perfil, aoFechar }: { perfil: Perfil; aoFechar: () => void }) {
  const [estado, acao, pendente] = useActionState(redefinirSenha, null);
  const [erros, limparErro] = useErrosCampos(estado);
  useAoConcluir(estado, aoFechar);

  return (
    <form onSubmit={enviarSemResetar(acao)} onChange={limparErro} className="grid gap-4" noValidate>
      {estado && !estado.ok && !estado.campos && <MensagemErro>{estado.erro}</MensagemErro>}
      <input type="hidden" name="id" value={perfil.id} />
      <CampoSenhaInicial rotulo="Nova senha temporária" erro={erros?.senha} />
      <DialogFooter>
        <Button type="button" variant="outline" onClick={aoFechar} disabled={pendente}>
          Cancelar
        </Button>
        <Button type="submit" disabled={pendente}>
          {pendente && <Loader2 className="animate-spin" aria-hidden />}
          Redefinir senha
        </Button>
      </DialogFooter>
    </form>
  );
}

export function DialogRedefinirSenha({
  perfil,
  aoFechar,
}: {
  perfil?: Perfil;
  aoFechar: () => void;
}) {
  return (
    <Dialog open={!!perfil} onOpenChange={(o) => !o && aoFechar()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Redefinir senha{perfil ? ` de ${perfil.nome}` : ""}</DialogTitle>
          <DialogDescription>
            A senha atual deixa de valer. A pessoa entra com a nova senha e escolhe outra.
          </DialogDescription>
        </DialogHeader>
        {perfil && <FormRedefinirSenha key={perfil.id} perfil={perfil} aoFechar={aoFechar} />}
      </DialogContent>
    </Dialog>
  );
}
