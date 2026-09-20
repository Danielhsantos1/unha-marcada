"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { AgendaAppointment } from "@/components/admin/appointment-card";
import { CancelAppointmentButton } from "@/components/admin/cancel-appointment-button";
import { CompleteAppointmentButton } from "@/components/admin/complete-appointment-button";
import type { FlatBlock } from "@/components/admin/agenda-filterable-view";
import {
  APPOINTMENT_STATUS_BORDER_HEX,
  APPOINTMENT_STATUS_COLORS,
  APPOINTMENT_STATUS_LABELS,
} from "@/lib/constants";
import { cn, formatBRL, formatSaoPauloDateTime, formatTimeBR } from "@/lib/utils";

const WEEKDAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export function AgendaMonthView({
  slug,
  days,
  referenceMonth,
  todayISO,
  initialSelectedISO,
  appointments,
  blocks,
  closedDays,
}: {
  slug: string;
  days: string[];
  referenceMonth: string;
  todayISO: string;
  initialSelectedISO: string;
  appointments: (AgendaAppointment & { appointment_date: string })[];
  blocks: FlatBlock[];
  closedDays: string[];
}) {
  const [selected, setSelected] = useState(initialSelectedISO);

  const appointmentsByDate = useMemo(() => {
    const map = new Map<string, (AgendaAppointment & { appointment_date: string })[]>();
    for (const appt of appointments) {
      const list = map.get(appt.appointment_date) ?? [];
      list.push(appt);
      map.set(appt.appointment_date, list);
    }
    return map;
  }, [appointments]);

  const blocksByDate = useMemo(() => {
    const map = new Map<string, FlatBlock[]>();
    for (const block of blocks) {
      const list = map.get(block.date) ?? [];
      list.push(block);
      map.set(block.date, list);
    }
    return map;
  }, [blocks]);

  const selectedAppointments = appointmentsByDate.get(selected) ?? [];
  const selectedBlocks = blocksByDate.get(selected) ?? [];
  const selectedIsClosed = closedDays.includes(selected);
  const selectedTotalCents = selectedAppointments.reduce((sum, a) => sum + a.total_price_cents, 0);
  const selectedLabel = format(new Date(`${selected}T12:00:00Z`), "EEE · d MMM", { locale: ptBR }).toUpperCase();

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="grid min-w-0 grid-cols-7 gap-2">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="text-center text-[10px] font-medium text-neutral-400 sm:text-xs">
            {label}
          </div>
        ))}

        {days.map((day) => {
          const inMonth = day.slice(0, 7) === referenceMonth;
          const count = (appointmentsByDate.get(day) ?? []).length;
          const isClosed = closedDays.includes(day);
          const isToday = day === todayISO;
          const isSelected = day === selected;
          const dayNumber = Number(day.slice(8, 10));

          return (
            <button
              key={day}
              type="button"
              onClick={() => setSelected(day)}
              className={cn(
                "flex h-[68px] min-w-0 flex-col items-start gap-1 overflow-hidden rounded-xl border p-1.5 text-left transition-colors sm:h-20 sm:p-2",
                isClosed
                  ? "border-transparent bg-neutral-400 text-white"
                  : "border-neutral-200 bg-white hover:border-rose-300",
                !inMonth && "opacity-30",
                isToday && "bg-rose-50 ring-2 ring-rose-300",
                isSelected && "bg-rose-100 ring-2 ring-rose-700",
              )}
            >
              <span className={cn("text-xs font-medium sm:text-sm", isClosed ? "text-white" : "text-neutral-700")}>
                {dayNumber}
              </span>
              {isClosed ? (
                <Store className="h-3.5 w-3.5 shrink-0 opacity-80" aria-label="Fechado" />
              ) : count > 0 ? (
                <span className="w-full truncate text-[10px] font-medium text-rose-700 sm:text-xs">• {count}</span>
              ) : null}
              {isToday && (
                <span className="mt-auto w-fit max-w-full truncate rounded-full bg-rose-600 px-1.5 py-0.5 text-[8px] font-medium text-white sm:px-2 sm:text-[10px]">
                  Hoje
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-sm font-bold text-neutral-900">
          <span className="h-2 w-2 shrink-0 rounded-full bg-rose-600" />
          {selectedLabel} • {selectedAppointments.length}{" "}
          {selectedAppointments.length === 1 ? "agendamento" : "agendamentos"}
          {selectedTotalCents > 0 && ` • ${formatBRL(selectedTotalCents)}`}
        </div>

        {selectedAppointments.length === 0 && selectedBlocks.length === 0 ? (
          <p className="py-6 text-center text-sm text-neutral-400">
            {selectedIsClosed ? "Estúdio fechado nesse dia." : "Nenhum agendamento nesse dia."}
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {selectedBlocks.map((block, i) => (
              <div
                key={i}
                className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-600"
              >
                🔒 Bloqueado ({formatSaoPauloDateTime(block.startsAt).time}–
                {formatSaoPauloDateTime(block.endsAt).time})
                {block.reason && <span className="block text-neutral-500">Motivo: {block.reason}</span>}
              </div>
            ))}
            {selectedAppointments.map((appt) => (
              <MonthAppointmentRow key={appt.id} slug={slug} appointment={appt} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MonthAppointmentRow({
  slug,
  appointment,
}: {
  slug: string;
  appointment: AgendaAppointment;
}) {
  const canCancel = appointment.status === "PENDING_PAYMENT" || appointment.status === "CONFIRMED";
  const canComplete = appointment.status === "CONFIRMED";

  return (
    <div className="flex overflow-hidden rounded-xl border border-neutral-200">
      <div
        className="flex w-16 shrink-0 items-center justify-center px-1 text-center text-xs font-bold text-white sm:w-20 sm:text-sm"
        style={{ backgroundColor: APPOINTMENT_STATUS_BORDER_HEX[appointment.status] }}
      >
        {formatTimeBR(appointment.start_time)}
      </div>
      <div className="min-w-0 flex-1 p-2.5">
        <p className="truncate text-sm font-semibold text-neutral-900">{appointment.client_name}</p>
        <p className="truncate text-xs text-neutral-500">
          {appointment.service?.name ?? "Serviço"} • {formatBRL(appointment.total_price_cents)}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1 p-2">
        <Badge className={cn(APPOINTMENT_STATUS_COLORS[appointment.status], "hidden sm:inline-flex")}>
          {APPOINTMENT_STATUS_LABELS[appointment.status]}
        </Badge>
        {canComplete && <CompleteAppointmentButton slug={slug} appointmentId={appointment.id} />}
        {canCancel && <CancelAppointmentButton slug={slug} appointmentId={appointment.id} />}
      </div>
    </div>
  );
}

