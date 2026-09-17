import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { requireTenantStaff } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { getAgendaRange, type AgendaView } from "@/lib/admin/agenda-range";
import { AgendaNav } from "@/components/admin/agenda-nav";
import { StatusLegend } from "@/components/admin/status-legend";
import { AppointmentCard, type AgendaAppointment } from "@/components/admin/appointment-card";
import { cn, formatDateBR, formatTimeBR } from "@/lib/utils";

function isValidView(value: string | undefined): value is AgendaView {
  return value === "dia" || value === "semana" || value === "mes";
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

  const { tenant } = await requireTenantStaff(slug);
  const supabase = await createClient();
  const range = getAgendaRange(view, referenceDateISO);

  const [{ data: appointments }, { data: blocks }] = await Promise.all([
    supabase
      .from("appointments")
      .select("id, client_name, client_phone, start_time, end_time, status, appointment_date, service:services(name)")
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
  ]);

  const appointmentsByDate = new Map<string, AgendaAppointment[]>();
  for (const appt of (appointments ?? []) as unknown as (AgendaAppointment & { appointment_date: string })[]) {
    const list = appointmentsByDate.get(appt.appointment_date) ?? [];
    list.push(appt);
    appointmentsByDate.set(appt.appointment_date, list);
  }

  const blockedDatesSet = new Set<string>();
  for (const block of blocks ?? []) {
    for (const day of range.days) {
      const dayStart = new Date(`${day}T00:00:00.000-03:00`).getTime();
      const dayEnd = new Date(`${day}T23:59:59.999-03:00`).getTime();
      const blockStart = new Date(block.starts_at).getTime();
      const blockEnd = new Date(block.ends_at).getTime();
      if (blockStart < dayEnd && blockEnd > dayStart) blockedDatesSet.add(day);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-900">Agenda</h1>
        <Link
          href={`/${slug}/admin/configuracoes`}
          className="text-xs font-medium text-rose-600 hover:underline"
        >
          Bloquear horário
        </Link>
      </div>

      <AgendaNav slug={slug} view={view} referenceDateISO={referenceDateISO} />
      <StatusLegend />

      {view === "dia" && (
        <DayView
          slug={slug}
          dateISO={referenceDateISO}
          appointments={appointmentsByDate.get(referenceDateISO) ?? []}
          isBlocked={blockedDatesSet.has(referenceDateISO)}
        />
      )}

      {view === "semana" && (
        <WeekView slug={slug} days={range.days} appointmentsByDate={appointmentsByDate} blockedDatesSet={blockedDatesSet} />
      )}

      {view === "mes" && (
        <MonthView
          slug={slug}
          days={range.days}
          referenceDateISO={referenceDateISO}
          appointmentsByDate={appointmentsByDate}
          blockedDatesSet={blockedDatesSet}
        />
      )}
    </div>
  );
}

function DayView({
  slug,
  dateISO,
  appointments,
  isBlocked,
}: {
  slug: string;
  dateISO: string;
  appointments: AgendaAppointment[];
  isBlocked: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4">
      <p className="text-sm font-medium text-neutral-700">{formatDateBR(dateISO)}</p>

      {isBlocked && (
        <div className="rounded-lg border border-neutral-300 bg-neutral-100 px-3 py-2 text-xs text-neutral-600">
          Este dia tem horários bloqueados.
        </div>
      )}

      {appointments.length === 0 ? (
        <p className="py-8 text-center text-sm text-neutral-400">Nenhum agendamento neste dia.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {appointments.map((appt) => (
            <AppointmentCard key={appt.id} slug={slug} appointment={appt} />
          ))}
        </div>
      )}
    </div>
  );
}

function WeekView({
  slug,
  days,
  appointmentsByDate,
  blockedDatesSet,
}: {
  slug: string;
  days: string[];
  appointmentsByDate: Map<string, AgendaAppointment[]>;
  blockedDatesSet: Set<string>;
}) {
  return (
    <div className="grid gap-3 overflow-x-auto sm:grid-cols-2 lg:grid-cols-7">
      {days.map((day) => (
        <div key={day} className="flex min-w-[160px] flex-col gap-2 rounded-2xl border border-neutral-200 bg-white p-3">
          <p className="text-xs font-medium capitalize text-neutral-500">
            {format(new Date(`${day}T12:00:00Z`), "EEE, d MMM", { locale: ptBR })}
          </p>
          {blockedDatesSet.has(day) && (
            <span className="w-fit rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] text-neutral-500">
              Bloqueado
            </span>
          )}
          <div className="flex flex-col gap-1.5">
            {(appointmentsByDate.get(day) ?? []).map((appt) => (
              <AppointmentCard key={appt.id} slug={slug} appointment={appt} compact />
            ))}
            {(appointmentsByDate.get(day) ?? []).length === 0 && (
              <p className="text-xs text-neutral-300">—</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function MonthView({
  slug,
  days,
  referenceDateISO,
  appointmentsByDate,
  blockedDatesSet,
}: {
  slug: string;
  days: string[];
  referenceDateISO: string;
  appointmentsByDate: Map<string, AgendaAppointment[]>;
  blockedDatesSet: Set<string>;
}) {
  const currentMonth = referenceDateISO.slice(0, 7);

  return (
    <div className="grid grid-cols-7 gap-1 sm:gap-2">
      {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((label) => (
        <div key={label} className="text-center text-[10px] font-medium text-neutral-400 sm:text-xs">
          {label}
        </div>
      ))}

      {days.map((day) => {
        const inMonth = day.slice(0, 7) === currentMonth;
        const dayAppointments = appointmentsByDate.get(day) ?? [];
        const dayNumber = Number(day.slice(8, 10));

        return (
          <Link
            key={day}
            href={`/${slug}/admin/agenda?view=dia&data=${day}`}
            className={cn(
              "flex min-h-12 flex-col gap-1 rounded-lg border border-neutral-200 bg-white p-1 text-left hover:border-rose-300 sm:min-h-20 sm:rounded-xl sm:p-2",
              !inMonth && "opacity-40",
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-neutral-700 sm:text-xs">{dayNumber}</span>
              {blockedDatesSet.has(day) && <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" />}
            </div>

            {/* Phones: just a dot so the day stays tappable and legible — the full list only fits from sm: up. */}
            {dayAppointments.length > 0 && (
              <span className="h-1.5 w-1.5 rounded-full bg-rose-400 sm:hidden" />
            )}

            <div className="hidden flex-col gap-0.5 sm:flex">
              {dayAppointments.slice(0, 3).map((appt) => (
                <span key={appt.id} className="truncate text-[10px] text-neutral-500">
                  {formatTimeBR(appt.start_time)} {appt.client_name}
                </span>
              ))}
              {dayAppointments.length > 3 && (
                <span className="text-[10px] text-rose-500">+{dayAppointments.length - 3} mais</span>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
