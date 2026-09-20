import { BarChart3, Wallet, CircleDollarSign, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { requireTenantStaff } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { computeFinancialStatus } from "@/lib/payments/financial-status";
import { formatBRL } from "@/lib/utils";
import type { AppointmentPaymentSummary, AppointmentStatus } from "@/types/database";

export default async function RelatoriosPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { tenant } = await requireTenantStaff(slug);
  const supabase = await createClient();

  const today = new Date().toISOString().slice(0, 10);
  const monthStart = `${today.slice(0, 7)}-01`;

  const [{ data: monthAppointments }, { data: monthTransactions }, { data: pendingSummaries }] =
    await Promise.all([
      supabase
        .from("appointments")
        .select("id, total_price_cents, status")
        .eq("tenant_id", tenant.id)
        .gte("appointment_date", monthStart)
        .in("status", ["CONFIRMED", "COMPLETED"])
        .returns<{ id: string; total_price_cents: number; status: AppointmentStatus }[]>(),
      supabase
        .from("payment_transactions")
        .select("appointment_id, type, amount_cents")
        .eq("tenant_id", tenant.id)
        .gte("recorded_at", `${monthStart}T00:00:00.000Z`)
        .returns<{ appointment_id: string; type: string; amount_cents: number }[]>(),
      // Snapshot atual, não do mês — uma pendência não deixa de existir
      // porque o mês virou.
      supabase
        .from("appointment_payment_summary")
        .select("*")
        .eq("tenant_id", tenant.id)
        .eq("appointment_status", "COMPLETED")
        .gt("balance_due_cents", 0)
        .returns<AppointmentPaymentSummary[]>(),
    ]);

  const transactions = monthTransactions ?? [];
  const totalRecebidoMes = transactions.reduce((sum, t) => sum + t.amount_cents, 0);

  const receivedByAppointment = new Map<string, number>();
  for (const t of transactions) {
    receivedByAppointment.set(t.appointment_id, (receivedByAppointment.get(t.appointment_id) ?? 0) + t.amount_cents);
  }
  let atendimentosQuitadosMes = 0;
  let atendimentosSaldoPendenteMes = 0;
  for (const appt of monthAppointments ?? []) {
    const status = computeFinancialStatus({
      appointmentStatus: appt.status,
      totalPriceCents: appt.total_price_cents,
      amountReceivedCents: receivedByAppointment.get(appt.id) ?? 0,
    });
    if (status === "QUITADO") atendimentosQuitadosMes += 1;
    if (status === "SALDO_PENDENTE") atendimentosSaldoPendenteMes += 1;
  }

  const totalAReceber = (pendingSummaries ?? []).reduce((sum, s) => sum + s.balance_due_cents, 0);
  const quantidadePendencias = (pendingSummaries ?? []).length;

  const financialCards = [
    { label: "Total recebido (mês)", value: formatBRL(totalRecebidoMes), icon: Wallet },
    { label: "Total a receber", value: formatBRL(totalAReceber), icon: CircleDollarSign },
    { label: "Quantidade de pendências", value: String(quantidadePendencias), icon: AlertTriangle },
    { label: "Atendimentos quitados (mês)", value: String(atendimentosQuitadosMes), icon: CheckCircle2 },
    { label: "Saldo pendente (mês)", value: String(atendimentosSaldoPendenteMes), icon: Clock },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-neutral-900">Relatórios</h1>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {financialCards.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-4 p-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs text-neutral-500">{label}</p>
                <p className="text-lg font-semibold text-neutral-900">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-neutral-300 bg-white py-20 text-center">
        <BarChart3 className="h-8 w-8 text-neutral-300" />
        <h2 className="text-lg font-semibold text-neutral-700">Mais relatórios chegam na próxima fase</h2>
        <p className="max-w-sm text-sm text-neutral-400">
          Receita mensal/semanal, serviços mais vendidos, clientes recorrentes e taxa
          de cancelamento serão implementados na Fase 3, junto com as notificações
          via WhatsApp.
        </p>
      </div>
    </div>
  );
}
