import { APPOINTMENT_STATUS_COLORS, APPOINTMENT_STATUS_LABELS } from "@/lib/constants";
import type { AppointmentStatus } from "@/types/database";

const ORDER: AppointmentStatus[] = ["PENDING_PAYMENT", "CONFIRMED", "COMPLETED", "CANCELLED", "EXPIRED"];

export function StatusLegend() {
  return (
    <div className="flex flex-wrap gap-3 text-xs text-neutral-500">
      {ORDER.map((status) => (
        <span key={status} className="flex items-center gap-1.5">
          <span className={`h-2.5 w-2.5 rounded-full border ${APPOINTMENT_STATUS_COLORS[status]}`} />
          {APPOINTMENT_STATUS_LABELS[status]}
        </span>
      ))}
      <span className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full border bg-neutral-300 border-neutral-400" />
        Bloqueado
      </span>
    </div>
  );
}
