import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Lock } from "lucide-react";
import { requireTenantStaff } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { getAgendaRange, type AgendaView } from "@/lib/admin/agenda-range";
import { AgendaNav } from "@/components/admin/agenda-nav";
import { AgendaFilterableView, type FlatBlock } from "@/components/admin/agenda-filterable-view";
import { AgendaMonthView } from "@/components/admin/agenda-month-view";
import type { AgendaAppointment } from "@/components/admin/appointment-card";
import { NewAppointmentDialog } from "@/components/admin/new-appointment-dialog";
import type { Service } from "@/types/database";

function isValidView(value: string | undefined): value is AgendaView {
  return value === "dia" || value === "semana" || value === "mes";
}

/** Day of week (0 = Sunday .. 6 = Saturday) for a "YYYY-MM-DD" date string — same rule as the availability engine. */
function dayOfWeekFor(dateISO: string): number {
  return new Date(`${dateISO}T12:00:00Z`).getUTCDay();
}

/** "14 – 20 de set." (semana), "15 de setembro" (dia) ou "Setembro de 2026" (mês). */
function formatRangeLabel(view: AgendaView, referenceDateISO: string, days: string[]): string {
  if (view === "dia") {
    return format(new Date(`${referenceDateISO}T12:00:00Z`), "d 'de' MMMM", { locale: ptBR });
  }
  if (view === "mes") {
    const label = format(new Date(`${referenceDateISO}T12:00:00Z`), "MMMM 'de' yyyy", { locale: ptBR });
    return label.charAt(0).toUpperCase() + label.slice(1);
  }
  const start = new Date(`${days[0]}T12:00:00Z`);
  const end = new Date(`${days[days.length - 1]}T12:00:00Z`);
  return `${format(start, "d")} – ${format(end, "d 'de' MMM", { locale: ptBR })}`;
}

interface BlockInfo {
  reason: string | null;
  startsAt: string;
  endsAt: string;
}

export default async function AgendaPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ view?: string; data?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const view: AgendaView = isValidView(query.view) ? query.view : "dia";
  const referenceDateISO = query.data && /^\d{4}-\d{2}-\d{2}$/.test(query.data) ? query.data : format(new Date(), "yyyy-MM-dd");
  const todayISO = format(new Date(), "yyyy-MM-dd");

  const { tenant } = await requireTenantStaff(slug);
  const supabase = await createClient();
  const range = getAgendaRange(view, referenceDateISO);

  const [{ data: appointments }, { data: blocks }, { data: availability }, { data: services }] =
    await Promise.all([
      supabase
        .from("appointments")
        .select(
          "id, client_name, client_phone, start_time, end_time, status, appointment_date, total_price_cents, service:services(name)",
        )
        .eq("tenant_id", tenant.id)
        .gte("appointment_date", range.startISO)
        .lte("appointment_date", range.endISO)
        .neq("status", "EXPIRED")
        .order("start_time"),
      supabase
        .from("blocked_dates")
        .select("id, starts_at, ends_at, reason")
        .eq("tenant_id", tenant.id)
        .lt("starts_at", `${range.endISO}T23:59:59.999-03:00`)
        .gt("ends_at", `${range.startISO}T00:00:00.000-03:00`),
      supabase
        .from("availability")
        .select("day_of_week")
        .eq("tenant_id", tenant.id)
        .eq("is_active", true),
      supabase
        .from("services")
        .select("*")
        .eq("tenant_id", tenant.id)
        .eq("is_active", true)
        .order("display_order")
        .returns<Service[]>(),
    ]);

  const openWeekdays = new Set((availability ?? []).map((row) => row.day_of_week));
  const isDateClosed = (dateISO: string) => !openWeekdays.has(dayOfWeekFor(dateISO));
  const closedDays = range.days.filter(isDateClosed);

  const flatAppointments = (appointments ?? []) as unknown as (AgendaAppointment & { appointment_date: string })[];

  const blocksByDate = new Map<string, BlockInfo[]>();
  for (const block of blocks ?? []) {
    for (const day of range.days) {
      const dayStart = new Date(`${day}T00:00:00.000-03:00`).getTime();
      const dayEnd = new Date(`${day}T23:59:59.999-03:00`).getTime();
      const blockStart = new Date(block.starts_at).getTime();
      const blockEnd = new Date(block.ends_at).getTime();
      if (blockStart < dayEnd && blockEnd > dayStart) {
        const list = blocksByDate.get(day) ?? [];
        list.push({ reason: block.reason, startsAt: block.starts_at, endsAt: block.ends_at });
        blocksByDate.set(day, list);
      }
    }
  }
  const flatBlocks: FlatBlock[] = [...blocksByDate.entries()].flatMap(([date, list]) =>
    list.map((block) => ({ ...block, date })),
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold text-neutral-900">Agenda</h1>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/${slug}/admin/configuracoes`}
            className="flex h-12 shrink-0 items-center justify-center gap-1.5 rounded-full border border-rose-300 bg-white px-6 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-50"
          >
            <Lock className="h-4 w-4" />
            Bloquear horário
          </Link>
          <NewAppointmentDialog slug={slug} services={services ?? []} />
        </div>
      </div>

      <AgendaNav
        slug={slug}
        view={view}
        referenceDateISO={referenceDateISO}
        rangeLabel={formatRangeLabel(view, referenceDateISO, range.days)}
      />

      {(view === "dia" || view === "semana") && (
        <AgendaFilterableView
          slug={slug}
          days={range.days}
          todayISO={todayISO}
          appointments={flatAppointments}
          blocks={flatBlocks}
          closedDays={closedDays}
        />
      )}

      {view === "mes" && (
        <AgendaMonthView
          slug={slug}
          days={range.days}
          referenceMonth={referenceDateISO.slice(0, 7)}
          todayISO={todayISO}
          initialSelectedISO={referenceDateISO}
          appointments={flatAppointments}
          blocks={flatBlocks}
          closedDays={closedDays}
        />
      )}
    </div>
  );
}
