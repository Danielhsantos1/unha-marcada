import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAvailableSlots, hoursUntilAppointment, timeStringToMinutes, minutesToTimeString } from "@/lib/booking/availability";
import { rescheduleAppointmentSchema } from "@/lib/validations/reschedule";
import { SELF_SERVICE_CUTOFF_HOURS } from "@/lib/constants";

/**
 * Guest-facing reschedule. Same bearer-token pattern as the status/cancel
 * endpoints. The deposit already paid stays put — this only moves the
 * date/time, it never re-charges anything.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = rescheduleAppointmentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: appointment } = await supabase
    .from("appointments")
    .select("id, tenant_id, status, appointment_date, start_time, service:services(duration_minutes)")
    .eq("id", id)
    .maybeSingle<{
      id: string;
      tenant_id: string;
      status: string;
      appointment_date: string;
      start_time: string;
      service: { duration_minutes: number } | null;
    }>();

  if (!appointment || !appointment.service) {
    return NextResponse.json({ error: "Agendamento não encontrado." }, { status: 404 });
  }

  if (appointment.status !== "CONFIRMED") {
    return NextResponse.json(
      { error: "Este agendamento não pode mais ser remarcado por aqui." },
      { status: 409 },
    );
  }

  if (hoursUntilAppointment(appointment.appointment_date, appointment.start_time) < SELF_SERVICE_CUTOFF_HOURS) {
    return NextResponse.json(
      {
        error: `Remarcações só podem ser feitas até ${SELF_SERVICE_CUTOFF_HOURS}h antes do horário marcado. Entre em contato com o salão diretamente.`,
      },
      { status: 409 },
    );
  }

  const durationMinutes = appointment.service.duration_minutes;
  const availableSlots = await getAvailableSlots(
    appointment.tenant_id,
    parsed.data.date,
    durationMinutes,
    appointment.id,
  );

  if (!availableSlots.includes(parsed.data.time)) {
    return NextResponse.json(
      { error: "Este horário não está mais disponível. Escolha outro." },
      { status: 409 },
    );
  }

  const startMinutes = timeStringToMinutes(parsed.data.time);
  const endTime = `${minutesToTimeString(startMinutes + durationMinutes)}:00`;
  const startTime = `${parsed.data.time}:00`;

  const { error } = await supabase
    .from("appointments")
    .update({
      appointment_date: parsed.data.date,
      start_time: startTime,
      end_time: endTime,
    })
    .eq("id", id)
    .eq("status", "CONFIRMED");

  if (error) {
    return NextResponse.json({ error: "Não foi possível remarcar." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
