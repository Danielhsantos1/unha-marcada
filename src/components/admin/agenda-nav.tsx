import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { shiftReferenceDate, type AgendaView } from "@/lib/admin/agenda-range";
import { format } from "date-fns";

const VIEW_LABELS: Record<AgendaView, string> = { dia: "Dia", semana: "Semana", mes: "Mês" };

export function AgendaNav({
  slug,
  view,
  referenceDateISO,
}: {
  slug: string;
  view: AgendaView;
  referenceDateISO: string;
}) {
  const base = `/${slug}/admin/agenda`;
  const prevDate = shiftReferenceDate(view, referenceDateISO, -1);
  const nextDate = shiftReferenceDate(view, referenceDateISO, 1);
  const today = format(new Date(), "yyyy-MM-dd");

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-1 rounded-xl border border-neutral-200 bg-white p-1 shadow-sm">
        {(Object.keys(VIEW_LABELS) as AgendaView[]).map((v) => (
          <Link
            key={v}
            href={`${base}?view=${v}&data=${referenceDateISO}`}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              v === view ? "bg-rose-500 text-white" : "text-neutral-600 hover:bg-neutral-100",
            )}
          >
            {VIEW_LABELS[v]}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Link
          href={`${base}?view=${view}&data=${prevDate}`}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <Link
          href={`${base}?view=${view}&data=${today}`}
          className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-50"
        >
          Hoje
        </Link>
        <Link
          href={`${base}?view=${view}&data=${nextDate}`}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
