"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const PERIODS = [
  { label: "Manhã", test: (h: number) => h < 12 },
  { label: "Tarde", test: (h: number) => h >= 12 && h < 18 },
  { label: "Noite", test: (h: number) => h >= 18 },
];

function groupByPeriod(slots: string[]) {
  return PERIODS.map((period) => ({
    label: period.label,
    slots: slots.filter((time) => period.test(Number(time.slice(0, 2)))),
  })).filter((group) => group.slots.length > 0);
}

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

  const groups = slots ? groupByPeriod(slots) : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-1 text-center">
        <h2 className="text-xl font-semibold text-neutral-900">Escolha o horário</h2>
        <p className="text-sm text-neutral-500">Horários livres pra esse dia.</p>
      </div>

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

      {groups.length > 0 && (
        <div className="flex flex-col gap-5">
          {groups.map((group) => (
            <div key={group.label} className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                {group.label}
              </p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {group.slots.map((time) => {
                  const isSelected = time === selectedTime;
                  return (
                    <button
                      key={time}
                      type="button"
                      onClick={() => onSelect(time)}
                      className={cn(
                        "rounded-xl border bg-white px-3 py-2.5 text-sm font-medium text-neutral-900 shadow-sm transition-all hover:border-rose-300 hover:shadow-md",
                        isSelected
                          ? "border-rose-500 bg-rose-50 text-rose-700 ring-1 ring-rose-500"
                          : "border-neutral-200",
                      )}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
