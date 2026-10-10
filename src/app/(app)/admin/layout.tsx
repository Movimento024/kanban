import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { NavAdmin } from "@/components/admin/nav-admin";
import { exigirAdmin } from "@/server/sessao";

async function SoAdmin({ children }: { children: React.ReactNode }) {
  await exigirAdmin();
  return children;
}

export default function LayoutAdmin({ children }: LayoutProps<"/admin">) {
  return (
    <div className="grid gap-6">
      <div className="grid gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
        <NavAdmin />
      </div>
      <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
        <SoAdmin>{children}</SoAdmin>
      </Suspense>
    </div>
  );
}
