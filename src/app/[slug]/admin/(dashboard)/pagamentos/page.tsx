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

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-semibold text-neutral-900">Pagamentos</h1>

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
          {(payments ?? []).map((payment) => (
            <TableRow key={payment.id}>
              <TableCell className="font-medium">{payment.appointment?.client_name ?? "—"}</TableCell>
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
          {(payments ?? []).length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="py-8 text-center text-neutral-400">
                Nenhum pagamento registrado ainda.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
