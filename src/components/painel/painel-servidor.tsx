import { PainelItem } from "@/components/painel/painel-item";
import { listarFrentes } from "@/server/consultas/frentes";
import { exigirPerfil } from "@/server/sessao";

/** Carrega o que o painel do item precisa e o monta (vale para todas as telas). */
export async function PainelServidor() {
  const [perfil, frentes] = await Promise.all([exigirPerfil(), listarFrentes()]);
  return <PainelItem frentes={frentes} meuId={perfil.id} eAdmin={perfil.papel === "admin"} />;
}
