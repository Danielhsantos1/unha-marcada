import { CalendarCheck, DollarSign, HandCoins, UserPlus } from "lucide-react";
import { requireTenantStaff } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { formatBRL } from "@/lib/utils";

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

  const [{ count: todayCount }, { data: monthAppointments }, { data: monthPayments }, { data: allAppointments }] =
    await Promise.all([
      supabase
        .from("appointments")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenant.id)
        .eq("appointment_date", today)
        .in("status", ["CONFIRMED", "COMPLETED"]),
      supabase
        .from("appointments")
        .select("total_price_cents, status")
        .eq("tenant_id", tenant.id)
        .gte("appointment_date", monthStart)
        .in("status", ["CONFIRMED", "COMPLETED"]),
      supabase
        .from("payments")
        .select("amount_cents, created_at")
        .eq("tenant_id", tenant.id)
        .eq("status", "PAID")
        .gte("created_at", `${monthStart}T00:00:00.000Z`),
      supabase
        .from("appointments")
        .select("client_phone, created_at")
        .eq("tenant_id", tenant.id)
        .order("created_at", { ascending: true }),
    ]);

  const receitaPrevista = (monthAppointments ?? []).reduce((sum, a) => sum + a.total_price_cents, 0);
  const sinaisRecebidos = (monthPayments ?? []).reduce((sum, p) => sum + p.amount_cents, 0);

  const firstSeenByPhone = new Map<string, string>();
  for (const appt of allAppointments ?? []) {
    if (!firstSeenByPhone.has(appt.client_phone)) {
      firstSeenByPhone.set(appt.client_phone, appt.created_at);
    }
  }
  const clientesNovas = [...firstSeenByPhone.values()].filter((firstSeen) => firstSeen >= `${monthStart}T00:00:00.000Z`).length;

  const cards = [
    { label: "Agendamentos hoje", value: String(todayCount ?? 0), icon: CalendarCheck },
    { label: "Receita prevista (mês)", value: formatBRL(receitaPrevista), icon: DollarSign },
    { label: "Sinais recebidos (mês)", value: formatBRL(sinaisRecebidos), icon: HandCoins },
    { label: "Clientes novas (mês)", value: String(clientesNovas), icon: UserPlus },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold text-neutral-900">Dashboard</h1>

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
    </div>
  );
}
