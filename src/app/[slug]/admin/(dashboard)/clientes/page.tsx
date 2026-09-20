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

      {clients.length === 0 ? (
        <p className="rounded-2xl border border-neutral-200 bg-white py-8 text-center text-neutral-400 shadow-sm">
          Nenhuma cliente ainda.
        </p>
      ) : (
        <>
          {/* Celular: um card por cliente — uma tabela de 4 colunas não cabe
              numa tela de 360px sem rolar ou espremer o texto. */}
          <div className="flex flex-col gap-3 md:hidden">
            {clients.map((client) => (
              <div
                key={client.phone}
                className="flex flex-col gap-2 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-neutral-900">{client.name}</p>
                  <p className="whitespace-nowrap font-semibold text-rose-600">
                    {formatBRL(client.totalSpentCents)}
                  </p>
                </div>
                <p className="text-sm text-neutral-500">{client.phone}</p>
                <p className="text-sm text-neutral-400">
                  {client.visits} {client.visits === 1 ? "visita" : "visitas"}
                </p>
              </div>
            ))}
          </div>

          <div className="hidden md:block">
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
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
