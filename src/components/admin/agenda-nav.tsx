import Link from "next/link";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { shiftReferenceDate, type AgendaView } from "@/lib/admin/agenda-range";

const VIEW_LABELS: Record<AgendaView, string> = { dia: "Dia", semana: "Semana", mes: "Mês" };

export function AgendaNav({
  slug,
  view,
  referenceDateISO,
  rangeLabel,
}: {
  slug: string;
  view: AgendaView;
  referenceDateISO: string;
  rangeLabel: string;
}) {
  const base = `/${slug}/admin/agenda`;
  const prevDate = shiftReferenceDate(view, referenceDateISO, -1);
  const nextDate = shiftReferenceDate(view, referenceDateISO, 1);
  const today = format(new Date(), "yyyy-MM-dd");

  return (
    <div className="flex flex-col gap-3">
      <div className="flex w-fit items-center gap-1 rounded-full bg-neutral-100 p-1">
        {(Object.keys(VIEW_LABELS) as AgendaView[]).map((v) => (
          <Link
            key={v}
            href={`${base}?view=${v}&data=${referenceDateISO}`}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              v === view ? "bg-rose-600 text-white shadow-sm" : "text-neutral-500 hover:text-neutral-700",
            )}
          >
            {VIEW_LABELS[v]}
          </Link>
        ))}
      </div>

      <div className="flex items-center justify-between gap-2">
        <Link
          href={`${base}?view=${view}&data=${prevDate}`}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>

        <p className="min-w-0 flex-1 truncate text-center text-lg font-bold text-neutral-900 sm:text-xl">
          {rangeLabel}
        </p>

        <Link
          href={`${base}?view=${view}&data=${nextDate}`}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
        >
          <ChevronRight className="h-4 w-4" />
        </Link>

        <Link
          href={`${base}?view=${view}&data=${today}`}
          className="shrink-0 rounded-full bg-rose-100 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-200"
        >
          Hoje
        </Link>
      </div>
    </div>
  );
}
