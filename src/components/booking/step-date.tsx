"use client";

import { addDays, format, isToday, isTomorrow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const DAYS_AHEAD = 21;

// date-fns não abrevia dia da semana em pt-BR (o token "EEE" devolve a
// palavra inteira, ex. "segunda") — abreviação própria, indexada por
// getDay() (0 = domingo .. 6 = sábado).
const WEEKDAY_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function StepDate({
  selectedDate,
  onSelect,
  openWeekdays,
}: {
  selectedDate: string | null;
  onSelect: (dateISO: string) => void;
  /** Dias da semana (0 = domingo .. 6 = sábado) em que o salão atende.
   * Sem essa lista (undefined), nenhum dia é desabilitado — usado como
   * fallback seguro enquanto o chamador ainda não carregou os horários. */
  openWeekdays?: number[];
}) {
  const today = new Date();
  const days = Array.from({ length: DAYS_AHEAD }, (_, i) => addDays(today, i));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-1 text-center">
        <h2 className="text-xl font-semibold text-neutral-900">Escolha o dia</h2>
        <p className="text-sm text-neutral-500">Os próximos {DAYS_AHEAD} dias estão disponíveis.</p>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {days.map((day) => {
          const iso = format(day, "yyyy-MM-dd");
          const isSelected = iso === selectedDate;
          const isOpen = !openWeekdays || openWeekdays.includes(day.getDay());
          const topLabel = isToday(day)
            ? "Hoje"
            : isTomorrow(day)
              ? "Amanhã"
              : WEEKDAY_SHORT[day.getDay()];
          return (
            <button
              key={iso}
              type="button"
              disabled={!isOpen}
              onClick={() => onSelect(iso)}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-xl border bg-white px-2 py-3 text-sm shadow-sm transition-all",
                isOpen && "hover:border-rose-300 hover:shadow-md",
                isSelected
                  ? "border-rose-500 bg-rose-50 ring-1 ring-rose-500"
                  : "border-neutral-200",
                !isOpen && "cursor-not-allowed border-neutral-100 bg-neutral-50 opacity-50",
              )}
            >
              <span
                className={cn(
                  "text-xs capitalize",
                  isSelected ? "font-medium text-rose-600" : "text-neutral-400",
                )}
              >
                {isOpen ? topLabel : "Fechado"}
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
