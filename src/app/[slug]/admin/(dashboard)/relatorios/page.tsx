import { BarChart3 } from "lucide-react";
import { requireTenantStaff } from "@/lib/admin/auth";

export default async function RelatoriosPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await requireTenantStaff(slug);

  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-neutral-300 bg-white py-20 text-center">
      <BarChart3 className="h-8 w-8 text-neutral-300" />
      <h1 className="text-lg font-semibold text-neutral-700">Relatórios chegam na próxima fase</h1>
      <p className="max-w-sm text-sm text-neutral-400">
        Receita mensal/semanal, serviços mais vendidos, clientes recorrentes e taxa
        de cancelamento serão implementados na Fase 3, junto com as notificações
        via WhatsApp.
      </p>
    </div>
  );
}
