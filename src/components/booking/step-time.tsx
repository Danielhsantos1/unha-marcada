"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function StepTime({
  tenantSlug,
  serviceId,
  date,
  selectedTime,
  onSelect,
  excludeAppointmentId,
}: {
  tenantSlug: string;
  serviceId: string;
  date: string;
  selectedTime: string | null;
  onSelect: (time: string) => void;
  excludeAppointmentId?: string;
}) {
  const [slots, setSlots] = useState<string[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setSlots(null);
    setError(false);

    const exclude = excludeAppointmentId ? `&excludeAppointmentId=${excludeAppointmentId}` : "";
    fetch(`/api/tenants/${tenantSlug}/slots?serviceId=${serviceId}&date=${date}${exclude}`)
      .then((res) => {
        if (!res.ok) throw new Error("failed");
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setSlots(data.slots ?? []);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [tenantSlug, serviceId, date, excludeAppointmentId]);

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-center text-xl font-semibold text-neutral-900">
        Escolha o horário
      </h2>

      {slots === null && !error && (
        <div className="flex items-center justify-center gap-2 py-10 text-neutral-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          Carregando horários...
        </div>
      )}

      {error && (
        <p className="text-center text-sm text-red-600">
          Não foi possível carregar os horários. Tente novamente.
        </p>
      )}

      {slots && slots.length === 0 && (
        <p className="text-center text-sm text-neutral-500">
          Nenhum horário disponível neste dia. Escolha outra data.
        </p>
      )}

      {slots && slots.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {slots.map((time) => (
            <button
              key={time}
              type="button"
              onClick={() => onSelect(time)}
              className={cn(
                "rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-medium text-neutral-900 transition-colors hover:border-rose-300",
                time === selectedTime && "border-rose-500 bg-rose-50 ring-2 ring-rose-200",
              )}
            >
              {time}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
