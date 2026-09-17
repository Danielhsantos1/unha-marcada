import { requireTenantStaff } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PAYMENT_STATUS_COLORS, PAYMENT_STATUS_LABELS } from "@/lib/constants";
import { formatBRL, formatDateBR, formatSaoPauloDateTime, formatTimeBR } from "@/lib/utils";
import type { PaymentStatus } from "@/types/database";

interface PaymentRow {
  id: string;
  status: PaymentStatus;
  amount_cents: number;
  created_at: string;
  paid_at: string | null;
  appointment: {
    client_name: string;
    appointment_date: string;
    start_time: string;
    total_price_cents: number;
  } | null;
}

export default async function PagamentosPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { tenant } = await requireTenantStaff(slug);
  const supabase = await createClient();

  const { data: payments } = await supabase
    .from("payments")
    .select(
      "id, status, amount_cents, created_at, paid_at, appointment:appointments(client_name, appointment_date, start_time, total_price_cents)",
    )
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false })
    .limit(200)
    .returns<PaymentRow[]>();

  const rows = payments ?? [];

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-semibold text-neutral-900">Pagamentos</h1>

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-neutral-200 bg-white py-8 text-center text-neutral-400">
          Nenhum pagamento registrado ainda.
        </p>
      ) : (
        <>
          {/* Celular: 7 colunas não cabem em tela nenhuma sem espremer ou
              rolar — vira um card por pagamento com o essencial em cima. */}
          <div className="flex flex-col gap-3 md:hidden">
            {rows.map((payment) => (
              <div
                key={payment.id}
                className="flex flex-col gap-2 rounded-2xl border border-neutral-200 bg-white p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-neutral-900">
                    {payment.appointment?.client_name ?? "—"}
                  </p>
                  <Badge className={PAYMENT_STATUS_COLORS[payment.status]}>
                    {PAYMENT_STATUS_LABELS[payment.status]}
                  </Badge>
                </div>
                <p className="text-sm text-neutral-500">
                  {payment.appointment
                    ? `${formatDateBR(payment.appointment.appointment_date)} às ${formatTimeBR(payment.appointment.start_time)}`
                    : "—"}
                </p>
                <div className="mt-1 grid grid-cols-3 gap-2 border-t border-neutral-100 pt-2 text-sm">
                  <div>
                    <p className="text-xs text-neutral-400">Total</p>
                    <p className="font-medium text-neutral-800">
                      {payment.appointment ? formatBRL(payment.appointment.total_price_cents) : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-400">Sinal</p>
                    <p className="font-medium text-neutral-800">{formatBRL(payment.amount_cents)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-400">Falta</p>
                    <p className="font-medium text-rose-600">
                      {payment.appointment
                        ? formatBRL(payment.appointment.total_price_cents - payment.amount_cents)
                        : "—"}
                    </p>
                  </div>
                </div>
                {payment.paid_at && (
                  <p className="text-xs text-neutral-400">
                    Pago em {formatDateBR(formatSaoPauloDateTime(payment.paid_at).date)}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Agendamento</TableHead>
                  <TableHead>Valor total</TableHead>
                  <TableHead>Sinal</TableHead>
                  <TableHead>Falta cobrar</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pago em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">
                      {payment.appointment?.client_name ?? "—"}
                    </TableCell>
                    <TableCell>
                      {payment.appointment
                        ? `${formatDateBR(payment.appointment.appointment_date)} às ${formatTimeBR(payment.appointment.start_time)}`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {payment.appointment ? formatBRL(payment.appointment.total_price_cents) : "—"}
                    </TableCell>
                    <TableCell>{formatBRL(payment.amount_cents)}</TableCell>
                    <TableCell className="font-medium text-rose-600">
                      {payment.appointment
                        ? formatBRL(payment.appointment.total_price_cents - payment.amount_cents)
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge className={PAYMENT_STATUS_COLORS[payment.status]}>
                        {PAYMENT_STATUS_LABELS[payment.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {payment.paid_at ? formatDateBR(formatSaoPauloDateTime(payment.paid_at).date) : "—"}
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
