import { BarraTopo } from "@/components/layout/barra-topo";

export default function LayoutApp({ children }: LayoutProps<"/">) {
  return (
    <>
      <BarraTopo />
      <main className="mx-auto flex w-full max-w-7xl min-w-0 flex-1 flex-col px-4 py-6">
        {children}
      </main>
    </>
  );
}
