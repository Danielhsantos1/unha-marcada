import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * All scheduling math here works in "minutes since local midnight" and
 * assumes a single fixed timezone: America/Sao_Paulo (UTC-3, no DST since
 * 2019). That's a deliberate simplification for a Brazil-only salon app —
 * if this ever needs to support other countries/timezones, `tenants` would
 * need its own `timezone` column and every conversion below would need to
 * use it instead of the hardcoded offset.
 */
const TENANT_TZ_OFFSET_MINUTES = -3 * 60;
const SLOT_GRANULARITY_MINUTES = 15;

interface BusyInterval {
  startMin: number;
  endMin: number;
}

function timeStringToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTimeString(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (totalMinutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

/** Day of week (0 = Sunday .. 6 = Saturday) for a "YYYY-MM-DD" date string. */
function dayOfWeekFor(dateISO: string): number {
  return new Date(`${dateISO}T12:00:00Z`).getUTCDay();
}

/** Current time in Sao Paulo, as {dateISO, minutesOfDay}. */
function nowInTenantTimezone(): { dateISO: string; minutesOfDay: number } {
  const utcNow = new Date();
  const localMs = utcNow.getTime() + TENANT_TZ_OFFSET_MINUTES * 60_000;
  const local = new Date(localMs);
  const dateISO = local.toISOString().slice(0, 10);
  const minutesOfDay = local.getUTCHours() * 60 + local.getUTCMinutes();
  return { dateISO, minutesOfDay };
}

/** Clips a timestamptz range onto a given local date, returning minutes-of-day. */
function clipRangeToLocalDate(
  startsAtIso: string,
  endsAtIso: string,
  dateISO: string,
): BusyInterval | null {
  const dayStartUtc = new Date(`${dateISO}T00:00:00.000Z`).getTime() - TENANT_TZ_OFFSET_MINUTES * 60_000;
  const dayEndUtc = dayStartUtc + 24 * 60 * 60_000;

  const startMs = Math.max(new Date(startsAtIso).getTime(), dayStartUtc);
  const endMs = Math.min(new Date(endsAtIso).getTime(), dayEndUtc);

  if (endMs <= startMs) return null;

  const startMin = Math.floor((startMs - dayStartUtc) / 60_000);
  const endMin = Math.ceil((endMs - dayStartUtc) / 60_000);
  return { startMin, endMin };
}

function intervalsOverlap(a: BusyInterval, b: BusyInterval): boolean {
  return a.startMin < b.endMin && b.startMin < a.endMin;
}

export async function getAvailableSlots(
  tenantId: string,
  dateISO: string,
  durationMinutes: number,
  excludeAppointmentId?: string,
  bufferMinutes = 0,
): Promise<string[]> {
  const supabase = createAdminClient();
  const dow = dayOfWeekFor(dateISO);

  let appointmentsQuery = supabase
    .from("appointments")
    .select("start_time, end_time, status, hold_expires_at")
    .eq("tenant_id", tenantId)
    .eq("appointment_date", dateISO)
    .in("status", ["PENDING_PAYMENT", "CONFIRMED"]);

  if (excludeAppointmentId) {
    appointmentsQuery = appointmentsQuery.neq("id", excludeAppointmentId);
  }

  const [{ data: windows }, { data: blocks }, { data: appointments }] = await Promise.all([
    supabase
      .from("availability")
      .select("start_time, end_time")
      .eq("tenant_id", tenantId)
      .eq("day_of_week", dow)
      .eq("is_active", true),
    supabase
      .from("blocked_dates")
      .select("starts_at, ends_at")
      .eq("tenant_id", tenantId)
      .lte("starts_at", `${dateISO}T23:59:59.999Z`)
      .gte("ends_at", `${dateISO}T00:00:00.000Z`),
    appointmentsQuery,
  ]);

  if (!windows || windows.length === 0) return [];

  const nowIso = new Date().toISOString();
  const busy: BusyInterval[] = [];

  for (const block of blocks ?? []) {
    const clipped = clipRangeToLocalDate(block.starts_at, block.ends_at, dateISO);
    if (clipped) busy.push(clipped);
  }

  for (const appt of appointments ?? []) {
    const isActiveHold = appt.status === "CONFIRMED" || appt.hold_expires_at > nowIso;
    if (!isActiveHold) continue;
    // O buffer só se aplica contra outros atendimentos (intervalo de
    // limpeza/descanso) — bloqueios manuais do salão já representam
    // exatamente o intervalo que o dono quer, sem precisar de folga extra.
    busy.push({
      startMin: timeStringToMinutes(appt.start_time) - bufferMinutes,
      endMin: timeStringToMinutes(appt.end_time) + bufferMinutes,
    });
  }

  const { dateISO: todayISO, minutesOfDay: nowMinutes } = nowInTenantTimezone();
  const isToday = dateISO === todayISO;

  const slots: string[] = [];

  for (const window of windows) {
    const windowStart = timeStringToMinutes(window.start_time);
    const windowEnd = timeStringToMinutes(window.end_time);

    for (
      let candidateStart = windowStart;
      candidateStart + durationMinutes <= windowEnd;
      candidateStart += SLOT_GRANULARITY_MINUTES
    ) {
      if (isToday && candidateStart <= nowMinutes) continue;

      const candidate: BusyInterval = {
        startMin: candidateStart,
        endMin: candidateStart + durationMinutes,
      };

      const overlaps = busy.some((interval) => intervalsOverlap(candidate, interval));
      if (!overlaps) slots.push(minutesToTimeString(candidateStart));
    }
  }

  return slots;
}

/** How many hours from now until a "YYYY-MM-DD" + "HH:MM:SS" appointment starts. */
export function hoursUntilAppointment(dateISO: string, time: string): number {
  const target = new Date(`${dateISO}T${time}-03:00`);
  return (target.getTime() - Date.now()) / 3_600_000;
}

export { timeStringToMinutes, minutesToTimeString };
