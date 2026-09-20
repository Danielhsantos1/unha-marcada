import Link from "next/link";
import {
  CalendarCheck,
  DollarSign,
  HandCoins,
  UserPlus,
  AlertTriangle,
  Eye,
  MessageCircle,
  Share2,
  BarChart3,
  ChevronRight,
} from "lucide-react";
import { requireTenantStaff } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { formatBRL } from "@/lib/utils";
import { buildBookingShareLink } from "@/lib/whatsapp";
import type { AppointmentPaymentSummary, AppointmentStatus } from "@/types/database";

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { tenant } = await requireTenantStaff(slug);
  const supabase = await createClient();
  const bookingUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/${slug}/agendar`;

  const today = new Date().toISOString().slice(0, 10);
  const monthStart = `${today.slice(0, 7)}-01`;

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
      .gte("recorded_at", `${monthStart}T00:00:00.000Z`)
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

  const sinaisRecebidos = (monthTransactions ?? [])
    .filter((t) => t.type === "SINAL")
    .reduce((sum, t) => sum + t.amount_cents, 0);

  const totalAReceber = (pendingSummaries ?? []).reduce((sum, s) => sum + s.balance_due_cents, 0);
  const quantidadePendencias = (pendingSummaries ?? []).length;

  const firstSeenByPhone = new Map<string, string>();
  for (const appt of allAppointments ?? []) {
    if (!firstSeenByPhone.has(appt.client_phone)) {
      firstSeenByPhone.set(appt.client_phone, appt.created_at);
    }
  }
  const clientesNovas = [...firstSeenByPhone.values()].filter(
    (firstSeen) => firstSeen >= `${monthStart}T00:00:00.000Z`,
  ).length;

  const resumoMesCards = [
    { label: "Receita prevista", value: formatBRL(receitaPrevista), icon: DollarSign },
    { label: "Sinais recebidos", value: formatBRL(sinaisRecebidos), icon: HandCoins },
    { label: "Clientes novas", value: String(clientesNovas), icon: UserPlus },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <h1 className="text-xl font-semibold text-neutral-900">Dashboard</h1>
        <div className="flex flex-wrap gap-2">
          <a
            href={`/${slug}/agendar?preview=admin`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-rose-300 bg-white px-4 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50"
          >
            <Eye className="h-4 w-4" />
            Ver como cliente
          </a>
          <a
            href={buildBookingShareLink(tenant.name, bookingUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#25D366] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#20bd5a]"
          >
            <MessageCircle className="h-4 w-4" />
            Enviar link de agendamento por WhatsApp
          </a>
        </div>
      </div>

      {quantidadePendencias > 0 && (
        <div className="flex flex-col gap-3 rounded-2xl bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div>
              <p className="font-semibold text-amber-900">
                Você tem {formatBRL(totalAReceber)} para receber
              </p>
              <p className="text-sm text-amber-700">
                {quantidadePendencias} {quantidadePendencias === 1 ? "atendimento realizado" : "atendimentos realizados"}{" "}
                com saldo pendente
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href={`/${slug}/admin/contas-a-receber`}
              className="rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-amber-600"
            >
              Cobrar agora
            </Link>
            <Link
              href={`/${slug}/admin/contas-a-receber`}
              className="text-sm font-semibold text-amber-800 underline underline-offset-2"
            >
              Ver Contas a Receber
            </Link>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
              <CalendarCheck className="h-5 w-5" />
            </span>
            <span className="font-semibold text-neutral-900">Hoje</span>
          </div>
          <a
            href={buildBookingShareLink(tenant.name, bookingUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm font-medium text-rose-600 hover:underline"
          >
            <Share2 className="h-3.5 w-3.5" />
            Divulgar agenda
          </a>
        </div>
        <p className="text-3xl font-bold text-neutral-900">
          {todayCount ?? 0} {(todayCount ?? 0) === 1 ? "agendamento" : "agendamentos"}
        </p>
        <p className="text-sm text-neutral-400">
          {(todayCount ?? 0) === 0
            ? "Nenhum horário marcado hoje."
            : "Confira os detalhes na Agenda."}
        </p>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-neutral-900">Resumo do mês</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {resumoMesCards.map(({ label, value, icon: Icon }) => (
            <Card key={label}>
              <CardContent className="flex flex-col items-center gap-2 p-5 text-center">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                  <Icon className="h-5 w-5" />
                </span>
                <p className="text-xs text-neutral-500">{label}</p>
                <p className="text-lg font-bold text-neutral-900">{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold text-neutral-900">Financeiro</h2>
        <Link
          href={`/${slug}/admin/relatorios`}
          className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition-colors hover:bg-neutral-50"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
            <BarChart3 className="h-5 w-5" />
          </span>
          <span className="flex-1 text-sm font-medium text-neutral-900">
            Relatórios e transações financeiras
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-neutral-400" />
        </Link>
      </div>
    </div>
  );
}
