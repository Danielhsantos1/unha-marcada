import { notFound } from "next/navigation";
import { requireTenantStaff } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { PrintButton } from "@/components/admin/print-button";
import { PAYMENT_METHOD_LABELS, TRANSACTION_TYPE_LABELS } from "@/lib/payments/financial-status";
import { formatBRL, formatDateBR, formatSaoPauloDateTime } from "@/lib/utils";
import type { AppointmentPaymentSummary, PaymentTransaction } from "@/types/database";

export default async function ComprovantePage({
  params,
}: {
  params: Promise<{ slug: string; appointmentId: string; transactionId: string }>;
}) {
  const { slug, appointmentId, transactionId } = await params;
  const { tenant } = await requireTenantStaff(slug);
  const supabase = await createClient();

  const [{ data: transaction }, { data: appointment }, { data: summary }] = await Promise.all([
    supabase
      .from("payment_transactions")
      .select("*")
      .eq("id", transactionId)
      .eq("appointment_id", appointmentId)
      .maybeSingle<PaymentTransaction>(),
    supabase
      .from("appointments")
      .select("client_name, appointment_date, start_time, total_price_cents, service:services(name)")
      .eq("id", appointmentId)
      .maybeSingle<{
        client_name: string;
        appointment_date: string;
        start_time: string;
        total_price_cents: number;
        service: { name: string } | null;
      }>(),
    supabase
      .from("appointment_payment_summary")
      .select("*")
      .eq("appointment_id", appointmentId)
      .maybeSingle<AppointmentPaymentSummary>(),
  ]);

  if (!transaction || !appointment || !summary) notFound();

  const local = formatSaoPauloDateTime(transaction.recorded_at);
  const isQuitado = summary.balance_due_cents <= 0;

  return (
    <div className="mx-auto flex max-w-md flex-col gap-5 py-4">
      <div className="flex items-center justify-between print:hidden">
        <h1 className="text-lg font-semibold text-neutral-900">Comprovante</h1>
        <PrintButton />
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-6">
        <div className="text-center">
          <p className="text-sm font-semibold text-neutral-900">{tenant.name}</p>
          <p className="text-xs text-neutral-400">Comprovante nº {transaction.receipt_number}</p>
        </div>

        <div className="flex flex-col gap-2 border-t border-dashed border-neutral-200 pt-4 text-sm">
          <Row label="Tipo" value={TRANSACTION_TYPE_LABELS[transaction.type]} />
          <Row label="Cliente" value={appointment.client_name} />
          <Row label="Serviço" value={appointment.service?.name ?? "—"} />
          <Row
            label="Data do atendimento"
            value={`${formatDateBR(appointment.appointment_date)} às ${appointment.start_time.slice(0, 5)}`}
          />
          <Row label="Data do pagamento" value={`${formatDateBR(local.date)} às ${local.time}`} />
          <Row label="Forma de pagamento" value={PAYMENT_METHOD_LABELS[transaction.method]} />
          {transaction.note && <Row label="Observação" value={transaction.note} />}
        </div>

        <div className="flex flex-col gap-2 border-t border-dashed border-neutral-200 pt-4 text-sm">
          <Row
            label="Valor recebido"
            value={formatBRL(Math.abs(transaction.amount_cents))}
            highlight={transaction.amount_cents >= 0}
          />
          <Row label="Valor total do atendimento" value={formatBRL(appointment.total_price_cents)} />
          <Row label="Saldo restante" value={formatBRL(summary.balance_due_cents)} />
        </div>

        {isQuitado && (
          <p className="rounded-xl bg-emerald-50 py-2 text-center text-sm font-semibold text-emerald-700">
            ✅ PAGAMENTO INTEGRALMENTE QUITADO
          </p>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-neutral-500">{label}</span>
      <span className={highlight ? "font-semibold text-rose-600" : "font-medium text-neutral-900"}>{value}</span>
    </div>
  );
}
