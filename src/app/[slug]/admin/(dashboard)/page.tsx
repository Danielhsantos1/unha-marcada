import Link from "next/link";
import {
  CalendarCheck,
  DollarSign,
  HandCoins,
  UserPlus,
  Wallet,
  CircleDollarSign,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { requireTenantStaff } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { computeFinancialStatus } from "@/lib/payments/financial-status";
import { formatBRL } from "@/lib/utils";
import type { AppointmentPaymentSummary, AppointmentStatus } from "@/types/database";

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { tenant } = await requireTenantStaff(slug);
  const supabase = await createClient();

  const today = new Date().toISOString().slice(0, 10);
  const monthStart = `${today.slice(0, 7)}-01`;
  const monthStartIso = `${monthStart}T00:00:00.000Z`;

  const [
    { count: todayCount },
    { data: monthAppointments },
    { data: monthTransactions },
    { data: allAppointments },
    { data: pendingSummaries },
  ] = await Promise.all([
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenant.id)
      .eq("appointment_date", today)
      .in("status", ["CONFIRMED", "COMPLETED"]),
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
      .gte("recorded_at", monthStartIso)
      .returns<{ appointment_id: string; type: string; amount_cents: number }[]>(),
    supabase
      .from("appointments")
      .select("client_phone, created_at")
      .eq("tenant_id", tenant.id)
      .order("created_at", { ascending: true }),
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

  const receitaPrevista = (monthAppointments ?? []).reduce((sum, a) => sum + a.total_price_cents, 0);

  const transactions = monthTransactions ?? [];
  const sinaisRecebidos = transactions
    .filter((t) => t.type === "SINAL")
    .reduce((sum, t) => sum + t.amount_cents, 0);
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

  const firstSeenByPhone = new Map<string, string>();
  for (const appt of allAppointments ?? []) {
    if (!firstSeenByPhone.has(appt.client_phone)) {
      firstSeenByPhone.set(appt.client_phone, appt.created_at);
    }
  }
  const clientesNovas = [...firstSeenByPhone.values()].filter((firstSeen) => firstSeen >= monthStartIso).length;

  const cards = [
    { label: "Agendamentos hoje", value: String(todayCount ?? 0), icon: CalendarCheck },
    { label: "Receita prevista (mês)", value: formatBRL(receitaPrevista), icon: DollarSign },
    { label: "Sinais recebidos (mês)", value: formatBRL(sinaisRecebidos), icon: HandCoins },
    { label: "Clientes novas (mês)", value: String(clientesNovas), icon: UserPlus },
  ];

  const financialCards = [
    { label: "Total recebido (mês)", value: formatBRL(totalRecebidoMes), icon: Wallet },
    { label: "Total a receber", value: formatBRL(totalAReceber), icon: CircleDollarSign },
    { label: "Quantidade de pendências", value: String(quantidadePendencias), icon: AlertTriangle },
    { label: "Atendimentos quitados (mês)", value: String(atendimentosQuitadosMes), icon: CheckCircle2 },
    { label: "Saldo pendente (mês)", value: String(atendimentosSaldoPendenteMes), icon: Clock },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-neutral-900">Dashboard</h1>

      {quantidadePendencias > 0 && (
        <Link
          href={`/${slug}/admin/contas-a-receber`}
          className="flex items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-amber-800 transition-colors hover:bg-amber-100"
        >
          <span className="flex items-center gap-2 text-sm font-medium">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {quantidadePendencias} {quantidadePendencias === 1 ? "atendimento já realizado" : "atendimentos já realizados"}{" "}
            com saldo pendente — {formatBRL(totalAReceber)} pra cobrar.
          </span>
          <span className="shrink-0 text-xs font-semibold underline">Ver Contas a Receber</span>
        </Link>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-4 p-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600">
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

      <div>
        <h2 className="mb-3 text-sm font-semibold text-neutral-900">Financeiro</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {financialCards.map(({ label, value, icon: Icon }) => (
            <Card key={label}>
              <CardContent className="flex items-center gap-4 p-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600">
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
      </div>
    </div>
  );
}
