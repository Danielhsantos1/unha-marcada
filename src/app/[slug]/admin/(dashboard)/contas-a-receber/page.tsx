import { requireTenantStaff } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { ReceiveBalanceButton } from "@/components/admin/receive-balance-button";
import { cn, formatBRL, formatDateBR, formatTimeBR } from "@/lib/utils";
import type { AppointmentPaymentSummary, AppointmentStatus } from "@/types/database";

interface AppointmentRow {
  id: string;
  client_name: string;
  client_phone: string;
  appointment_date: string;
  start_time: string;
  status: AppointmentStatus;
  service: { name: string } | null;
}

const OLD_PENDING_DAYS = 7;

export default async function ContasAReceberPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { tenant } = await requireTenantStaff(slug);
  const supabase = await createClient();

  // "Saldo pendente" de verdade é depois do atendimento acontecer — sinal
  // pago de um agendamento futuro não é uma pendência, é o fluxo normal.
  const [{ data: appointments }, { data: summaries }] = await Promise.all([
    supabase
      .from("appointments")
      .select("id, client_name, client_phone, appointment_date, start_time, status, service:services(name)")
      .eq("tenant_id", tenant.id)
      .eq("status", "COMPLETED")
      .order("appointment_date", { ascending: true })
      .returns<AppointmentRow[]>(),
    supabase
      .from("appointment_payment_summary")
      .select("*")
      .eq("tenant_id", tenant.id)
      .gt("balance_due_cents", 0)
      .returns<AppointmentPaymentSummary[]>(),
  ]);

  const pendingByAppointment = new Map((summaries ?? []).map((s) => [s.appointment_id, s]));

  const rows = (appointments ?? [])
    .map((appointment) => ({ appointment, summary: pendingByAppointment.get(appointment.id) }))
    .filter((row): row is { appointment: AppointmentRow; summary: AppointmentPaymentSummary } => Boolean(row.summary))
    .sort((a, b) => a.appointment.appointment_date.localeCompare(b.appointment.appointment_date));

  const today = new Date();
  const totalPendingCents = rows.reduce((sum, row) => sum + row.summary.balance_due_cents, 0);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">Contas a Receber</h1>
        <p className="text-sm text-neutral-500">
          Atendimentos já realizados com saldo ainda não cobrado — {rows.length}{" "}
          {rows.length === 1 ? "pendência" : "pendências"}, {formatBRL(totalPendingCents)} no total.
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-neutral-200 bg-white py-8 text-center text-neutral-400 shadow-sm">
          Nenhuma pendência — tudo cobrado. 🎉
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map(({ appointment, summary }) => {
            const daysPending = Math.floor(
              (today.getTime() - new Date(`${appointment.appointment_date}T00:00:00-03:00`).getTime()) /
                86_400_000,
            );
            const isOld = daysPending >= OLD_PENDING_DAYS;

            return (
              <div
                key={appointment.id}
                className={cn(
                  "flex flex-col gap-2 rounded-2xl border bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between",
                  isOld ? "border-red-300 bg-red-50/40" : "border-neutral-200",
                )}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-neutral-900">{appointment.client_name}</p>
                    {isOld && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                        {daysPending} dias
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-neutral-500">
                    {appointment.service?.name ?? "—"} · atendido em{" "}
                    {formatDateBR(appointment.appointment_date)} às {formatTimeBR(appointment.start_time)}
                  </p>
                  <p className="text-xs text-neutral-400">{appointment.client_phone}</p>
                </div>
                <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                  <p className="text-lg font-semibold text-rose-600">{formatBRL(summary.balance_due_cents)}</p>
                  <ReceiveBalanceButton
                    slug={slug}
                    appointmentId={appointment.id}
                    balanceDueCents={summary.balance_due_cents}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
