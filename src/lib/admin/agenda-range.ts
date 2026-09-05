import {
  addDays,
  addMonths,
  addWeeks,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
} from "date-fns";

export type AgendaView = "dia" | "semana" | "mes";

export interface AgendaRange {
  /** Inclusive range, "YYYY-MM-DD", used for appointment_date filtering. */
  startISO: string;
  endISO: string;
  days: string[];
}

const WEEK_OPTS = { weekStartsOn: 1 as const }; // segunda-feira

export function getAgendaRange(view: AgendaView, referenceDateISO: string): AgendaRange {
  const reference = new Date(`${referenceDateISO}T12:00:00Z`);

  if (view === "dia") {
    return { startISO: referenceDateISO, endISO: referenceDateISO, days: [referenceDateISO] };
  }

  if (view === "semana") {
    const start = startOfWeek(reference, WEEK_OPTS);
    const end = endOfWeek(reference, WEEK_OPTS);
    const days = Array.from({ length: 7 }, (_, i) => format(addDays(start, i), "yyyy-MM-dd"));
    return { startISO: format(start, "yyyy-MM-dd"), endISO: format(end, "yyyy-MM-dd"), days };
  }

  // mês: inclui os dias da semana anterior/seguinte para completar a grade
  const monthStart = startOfMonth(reference);
  const monthEnd = endOfMonth(reference);
  const gridStart = startOfWeek(monthStart, WEEK_OPTS);
  const gridEnd = endOfWeek(monthEnd, WEEK_OPTS);
  const dayCount = Math.round((gridEnd.getTime() - gridStart.getTime()) / 86_400_000) + 1;
  const days = Array.from({ length: dayCount }, (_, i) => format(addDays(gridStart, i), "yyyy-MM-dd"));

  return { startISO: format(gridStart, "yyyy-MM-dd"), endISO: format(gridEnd, "yyyy-MM-dd"), days };
}

export function shiftReferenceDate(view: AgendaView, referenceDateISO: string, direction: 1 | -1): string {
  const reference = new Date(`${referenceDateISO}T12:00:00Z`);

  const shifted =
    view === "dia"
      ? addDays(reference, direction)
      : view === "semana"
        ? addWeeks(reference, direction)
        : addMonths(reference, direction);

  return format(shifted, "yyyy-MM-dd");
}
