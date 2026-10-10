import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Cliente PRIVILEGIADO (ignora RLS). Use apenas em server actions de admin que
 * precisam da Admin API do Auth, e sempre depois de confirmar que quem chama é admin.
 */
export function criarClienteAdmin() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
