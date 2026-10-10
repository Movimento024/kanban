import { PainelItem } from "@/components/painel/painel-item";
import { listarFrentes } from "@/server/consultas/frentes";
import { exigirPerfil } from "@/server/sessao";

/** Carrega o que o painel do item precisa e o monta (vale para todas as telas). */
export async function PainelServidor() {
  const [perfil, frentes] = await Promise.all([exigirPerfil(), listarFrentes()]);
  const eu = { id: perfil.id, nome: perfil.nome, iniciais: perfil.iniciais, regiao: perfil.regiao };
  return <PainelItem frentes={frentes} eu={eu} eAdmin={perfil.papel === "admin"} />;
}
