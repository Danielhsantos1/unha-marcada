import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hoursUntilAppointment } from "@/lib/booking/availability";
import { SELF_SERVICE_CUTOFF_HOURS } from "@/lib/constants";

/**
 * Guest-facing cancellation. Same bearer-token pattern as the status
 * endpoint: knowing the appointment's UUID is what proves it's yours.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: appointment } = await supabase
    .from("appointments")
    .select("id, status, appointment_date, start_time")
    .eq("id", id)
    .maybeSingle();

  if (!appointment) {
    return NextResponse.json({ error: "Agendamento não encontrado." }, { status: 404 });
  }

  if (appointment.status !== "CONFIRMED") {
    return NextResponse.json(
      { error: "Este agendamento não pode mais ser cancelado por aqui." },
      { status: 409 },
    );
  }

  if (hoursUntilAppointment(appointment.appointment_date, appointment.start_time) < SELF_SERVICE_CUTOFF_HOURS) {
    return NextResponse.json(
      {
        error: `Cancelamentos só podem ser feitos até ${SELF_SERVICE_CUTOFF_HOURS}h antes do horário marcado. Entre em contato com o salão diretamente.`,
      },
      { status: 409 },
    );
  }

  const { error } = await supabase
    .from("appointments")
    .update({ status: "CANCELLED", cancelled_reason: "Cancelado pela cliente." })
    .eq("id", id)
    .eq("status", "CONFIRMED");

  if (error) {
    return NextResponse.json({ error: "Não foi possível cancelar." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
