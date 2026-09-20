import { APPOINTMENT_STATUS_COLORS, APPOINTMENT_STATUS_LABELS } from "@/lib/constants";
import { formatTimeBR } from "@/lib/utils";
import { CancelAppointmentButton } from "@/components/admin/cancel-appointment-button";
import { CompleteAppointmentButton } from "@/components/admin/complete-appointment-button";
import type { AppointmentStatus } from "@/types/database";

export interface AgendaAppointment {
  id: string;
  client_name: string;
  client_phone: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  service: { name: string } | null;
}

export function AppointmentCard({
  slug,
  appointment,
  compact,
}: {
  slug: string;
  appointment: AgendaAppointment;
  compact?: boolean;
}) {
  const canCancel = appointment.status === "PENDING_PAYMENT" || appointment.status === "CONFIRMED";
  const canComplete = appointment.status === "CONFIRMED";

  return (
    <div
      className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-xs ${APPOINTMENT_STATUS_COLORS[appointment.status]}`}
    >
      <div className="min-w-0">
        <p className="font-semibold">
          {formatTimeBR(appointment.start_time)}–{formatTimeBR(appointment.end_time)}
        </p>
        <p className="truncate">{appointment.client_name}</p>
        {!compact && <p className="truncate opacity-80">{appointment.service?.name}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {!compact && (
          <span className="hidden rounded-full bg-white/60 px-2 py-0.5 sm:inline">
            {APPOINTMENT_STATUS_LABELS[appointment.status]}
          </span>
        )}
        {canComplete && <CompleteAppointmentButton slug={slug} appointmentId={appointment.id} />}
        {canCancel && <CancelAppointmentButton slug={slug} appointmentId={appointment.id} />}
      </div>
    </div>
  );
}
