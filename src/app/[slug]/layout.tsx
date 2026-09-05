export default function TenantLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1">{children}</div>
      <footer className="py-4 text-center text-[11px] text-neutral-400">
        Agendamento por{" "}
        <span className="font-medium text-neutral-500">Unha Marcada</span>
      </footer>
    </div>
  );
}
