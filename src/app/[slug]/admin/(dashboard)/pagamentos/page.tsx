import { requireTenantStaff } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { FinancialStatusBadge } from "@/components/admin/financial-status-badge";
import { ReceiveBalanceButton } from "@/components/admin/receive-balance-button";
import { PaymentHistoryDialog } from "@/components/admin/payment-history-dialog";
import { computeFinancialStatus } from "@/lib/payments/financial-status";
import { formatBRL, formatDateBR, formatSaoPauloDateTime, formatTimeBR } from "@/lib/utils";
import type { AppointmentPaymentSummary, AppointmentStatus } from "@/types/database";

interface AppointmentRow {
  id: string;
  client_name: string;
  appointment_date: string;
  start_time: string;
  status: AppointmentStatus;
  total_price_cents: number;
  service: { name: string } | null;
}

export default async function PagamentosPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { tenant } = await requireTenantStaff(slug);
  const supabase = await createClient();

  const [{ data: appointments }, { data: summaries }] = await Promise.all([
    supabase
      .from("appointments")
      .select("id, client_name, appointment_date, start_time, status, total_price_cents, service:services(name)")
      .eq("tenant_id", tenant.id)
      .in("status", ["CONFIRMED", "COMPLETED", "CANCELLED"])
      .order("appointment_date", { ascending: false })
      .order("start_time", { ascending: false })
      .limit(200)
      .returns<AppointmentRow[]>(),
    supabase
      .from("appointment_payment_summary")
      .select("*")
      .eq("tenant_id", tenant.id)
      .returns<AppointmentPaymentSummary[]>(),
  ]);

  const summaryByAppointment = new Map((summaries ?? []).map((s) => [s.appointment_id, s]));

  const rows = (appointments ?? []).map((appointment) => {
    const summary = summaryByAppointment.get(appointment.id) ?? {
      amount_received_cents: 0,
      balance_due_cents: appointment.total_price_cents,
      last_payment_at: null,
      last_receipt_number: null,
    };
    const financialStatus = computeFinancialStatus({
      appointmentStatus: appointment.status,
      totalPriceCents: appointment.total_price_cents,
      amountReceivedCents: summary.amount_received_cents,
    });
    return { appointment, summary, financialStatus };
  });

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-semibold text-neutral-900">Pagamentos</h1>

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-neutral-200 bg-white py-8 text-center text-neutral-400">
          Nenhum pagamento registrado ainda.
        </p>
      ) : (
        <>
          {/* Celular: um card por atendimento com o essencial em cima. */}
          <div className="flex flex-col gap-3 md:hidden">
            {rows.map(({ appointment, summary, financialStatus }) => (
              <PaymentCard key={appointment.id} slug={slug} appointment={appointment} summary={summary} financialStatus={financialStatus} />
            ))}
          </div>

          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Agendamento</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Recebido</TableHead>
                  <TableHead>Pendente</TableHead>
                  <TableHead>Último pagamento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(({ appointment, summary, financialStatus }) => (
                  <TableRow key={appointment.id}>
                    <TableCell className="font-medium">{appointment.client_name}</TableCell>
                    <TableCell>{appointment.service?.name ?? "—"}</TableCell>
                    <TableCell>
                      {formatDateBR(appointment.appointment_date)} às {formatTimeBR(appointment.start_time)}
                    </TableCell>
                    <TableCell>{formatBRL(appointment.total_price_cents)}</TableCell>
                    <TableCell>{formatBRL(summary.amount_received_cents)}</TableCell>
                    <TableCell className={summary.balance_due_cents > 0 ? "font-medium text-rose-600" : ""}>
                      {formatBRL(summary.balance_due_cents)}
                    </TableCell>
                    <TableCell>
                      {summary.last_payment_at
                        ? formatDateBR(formatSaoPauloDateTime(summary.last_payment_at).date)
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <FinancialStatusBadge status={financialStatus} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {summary.balance_due_cents > 0 && financialStatus !== "CANCELADO" && (
                          <ReceiveBalanceButton
                            slug={slug}
                            appointmentId={appointment.id}
                            balanceDueCents={summary.balance_due_cents}
                          />
                        )}
                        <PaymentHistoryDialog slug={slug} appointmentId={appointment.id} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}

function PaymentCard({
  slug,
  appointment,
  summary,
  financialStatus,
}: {
  slug: string;
  appointment: AppointmentRow;
  summary: Pick<AppointmentPaymentSummary, "amount_received_cents" | "balance_due_cents" | "last_payment_at">;
  financialStatus: ReturnType<typeof computeFinancialStatus>;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-neutral-200 bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-neutral-900">{appointment.client_name}</p>
        <FinancialStatusBadge status={financialStatus} />
      </div>
      <p className="text-sm text-neutral-500">
        {appointment.service?.name ?? "—"} · {formatDateBR(appointment.appointment_date)} às{" "}
        {formatTimeBR(appointment.start_time)}
      </p>
      <div className="mt-1 grid grid-cols-3 gap-2 border-t border-neutral-100 pt-2 text-sm">
        <div>
          <p className="text-xs text-neutral-400">Total</p>
          <p className="font-medium text-neutral-800">{formatBRL(appointment.total_price_cents)}</p>
        </div>
        <div>
          <p className="text-xs text-neutral-400">Recebido</p>
          <p className="font-medium text-neutral-800">{formatBRL(summary.amount_received_cents)}</p>
        </div>
        <div>
          <p className="text-xs text-neutral-400">Falta</p>
          <p className="font-medium text-rose-600">{formatBRL(summary.balance_due_cents)}</p>
        </div>
      </div>
      {summary.last_payment_at && (
        <p className="text-xs text-neutral-400">
          Último pagamento em {formatDateBR(formatSaoPauloDateTime(summary.last_payment_at).date)}
        </p>
      )}
      <div className="mt-1 flex items-center gap-2">
        {summary.balance_due_cents > 0 && financialStatus !== "CANCELADO" && (
          <ReceiveBalanceButton
            slug={slug}
            appointmentId={appointment.id}
            balanceDueCents={summary.balance_due_cents}
          />
        )}
        <PaymentHistoryDialog slug={slug} appointmentId={appointment.id} />
      </div>
    </div>
  );
}
