export default function LayoutAuth({ children }: LayoutProps<"/">) {
  return (
    <main className="bg-muted/40 flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <p className="mb-6 text-center text-lg font-semibold tracking-tight">Movimento 024</p>
        {children}
      </div>
    </main>
  );
}
