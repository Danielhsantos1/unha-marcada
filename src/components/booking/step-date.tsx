"use client";

import { addDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const DAYS_AHEAD = 21;

export function StepDate({
  selectedDate,
  onSelect,
}: {
  selectedDate: string | null;
  onSelect: (dateISO: string) => void;
}) {
  const today = new Date();
  const days = Array.from({ length: DAYS_AHEAD }, (_, i) => addDays(today, i));

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-center text-xl font-semibold text-neutral-900">
        Escolha o dia
      </h2>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {days.map((day) => {
          const iso = format(day, "yyyy-MM-dd");
          const isSelected = iso === selectedDate;
          return (
            <button
              key={iso}
              type="button"
              onClick={() => onSelect(iso)}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-xl border border-neutral-200 bg-white px-2 py-3 text-sm transition-colors hover:border-rose-300",
                isSelected && "border-rose-500 bg-rose-50 ring-2 ring-rose-200",
              )}
            >
              <span className="text-xs capitalize text-neutral-400">
                {format(day, "EEE", { locale: ptBR })}
              </span>
              <span className="text-lg font-semibold text-neutral-900">{format(day, "d")}</span>
              <span className="text-xs capitalize text-neutral-400">
                {format(day, "MMM", { locale: ptBR })}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
