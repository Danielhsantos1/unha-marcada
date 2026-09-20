import { User, Scissors } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  APPOINTMENT_STATUS_BORDER_HEX,
  APPOINTMENT_STATUS_COLORS,
  APPOINTMENT_STATUS_LABELS,
} from "@/lib/constants";
import { formatBRL, formatTimeBR } from "@/lib/utils";
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
  total_price_cents: number;
  service: { name: string } | null;
}

export function AppointmentCard({ slug, appointment }: { slug: string; appointment: AgendaAppointment }) {
  const canCancel = appointment.status === "PENDING_PAYMENT" || appointment.status === "CONFIRMED";
  const canComplete = appointment.status === "CONFIRMED";

  return (
    <div
      className="rounded-xl border-2 bg-white p-3"
      style={{ borderColor: APPOINTMENT_STATUS_BORDER_HEX[appointment.status] }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-bold text-neutral-900">
          {formatTimeBR(appointment.start_time)} – {formatTimeBR(appointment.end_time)}
        </span>
        <Badge className={APPOINTMENT_STATUS_COLORS[appointment.status]}>
          {APPOINTMENT_STATUS_LABELS[appointment.status]}
        </Badge>
      </div>

      <div className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-neutral-800">
        <User className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
        <span className="truncate">{appointment.client_name}</span>
      </div>

      <div className="mt-0.5 flex items-center gap-1.5 text-sm text-neutral-500">
        <Scissors className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
        <span className="truncate">
          {appointment.service?.name ?? "Serviço"} • {formatBRL(appointment.total_price_cents)}
        </span>
      </div>

      {(canComplete || canCancel) && (
        <div className="mt-2.5 flex items-center gap-1 border-t border-neutral-100 pt-2">
          {canComplete && <CompleteAppointmentButton slug={slug} appointmentId={appointment.id} />}
          {canCancel && <CancelAppointmentButton slug={slug} appointmentId={appointment.id} />}
        </div>
      )}
    </div>
  );
}
