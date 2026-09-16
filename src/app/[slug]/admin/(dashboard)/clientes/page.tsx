import { requireTenantStaff } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatBRL } from "@/lib/utils";

interface ClientSummary {
  name: string;
  phone: string;
  visits: number;
  totalSpentCents: number;
  lastAppointmentAt: string;
}

export default async function ClientesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { tenant } = await requireTenantStaff(slug);
  const supabase = await createClient();

  const { data: appointments } = await supabase
    .from("appointments")
    .select("client_name, client_phone, total_price_cents, status, created_at")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: true });

  // "Visita" = agendamento com sinal pago (CONFIRMED/COMPLETED). Um
  // PENDING_PAYMENT que nunca foi pago não conta como cliente de verdade.
  const clientsByPhone = new Map<string, ClientSummary>();
  for (const appt of appointments ?? []) {
    const existing = clientsByPhone.get(appt.client_phone);
    const isVisit = appt.status === "CONFIRMED" || appt.status === "COMPLETED";

    const entry: ClientSummary = existing ?? {
      name: appt.client_name,
      phone: appt.client_phone,
      visits: 0,
      totalSpentCents: 0,
      lastAppointmentAt: appt.created_at,
    };

    entry.name = appt.client_name;
    entry.lastAppointmentAt = appt.created_at;
    if (isVisit) {
      entry.visits += 1;
      entry.totalSpentCents += appt.total_price_cents;
    }

    clientsByPhone.set(appt.client_phone, entry);
  }

  const clients = [...clientsByPhone.values()].sort(
    (a, b) => new Date(b.lastAppointmentAt).getTime() - new Date(a.lastAppointmentAt).getTime(),
  );

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-semibold text-neutral-900">Clientes</h1>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>WhatsApp</TableHead>
            <TableHead>Visitas</TableHead>
            <TableHead>Total gasto</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow key={client.phone}>
              <TableCell className="font-medium">{client.name}</TableCell>
              <TableCell>{client.phone}</TableCell>
              <TableCell>{client.visits}</TableCell>
              <TableCell>{formatBRL(client.totalSpentCents)}</TableCell>
            </TableRow>
          ))}
          {clients.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="py-8 text-center text-neutral-400">
                Nenhuma cliente ainda.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
