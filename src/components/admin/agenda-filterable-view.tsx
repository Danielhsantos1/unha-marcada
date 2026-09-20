"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Sparkles, Store } from "lucide-react";
import { AppointmentCard, type AgendaAppointment } from "@/components/admin/appointment-card";
import { cn, formatSaoPauloDateTime } from "@/lib/utils";
import type { AppointmentStatus } from "@/types/database";

export interface FlatBlock {
  date: string;
  reason: string | null;
  startsAt: string;
  endsAt: string;
}

type FilterKey = AppointmentStatus | "BLOCKED";

// EXPIRED nunca aparece aqui — a query já exclui esse status da agenda (hold
// que venceu sem pagamento não é um agendamento de verdade), então não faz
// sentido ter um chip que nunca teria nada pra filtrar.
const FILTER_OPTIONS: { key: FilterKey; label: string; dot: string }[] = [
  { key: "CONFIRMED", label: "Confirmado", dot: "bg-emerald-600" },
  { key: "PENDING_PAYMENT", label: "Aguardando pagamento", dot: "bg-amber-500" },
  { key: "COMPLETED", label: "Concluído", dot: "bg-blue-600" },
  { key: "CANCELLED", label: "Cancelado", dot: "bg-red-600" },
  { key: "BLOCKED", label: "Bloqueado", dot: "bg-neutral-500" },
];

export function AgendaFilterableView({
  slug,
  days,
  todayISO,
  appointments,
  blocks,
  closedDays,
}: {
  slug: string;
  days: string[];
  todayISO: string;
  appointments: (AgendaAppointment & { appointment_date: string })[];
  blocks: FlatBlock[];
  closedDays: string[];
}) {
  // Vazio = nada escondido (tudo visível). Clicar num chip esconde/mostra
  // aquela categoria — não é um filtro exclusivo de "só isso".
  const [hidden, setHidden] = useState<Set<FilterKey>>(new Set());

  function toggle(key: FilterKey) {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const appointmentsByDate = useMemo(() => {
    const map = new Map<string, (AgendaAppointment & { appointment_date: string })[]>();
    for (const appt of appointments) {
      if (hidden.has(appt.status)) continue;
      const list = map.get(appt.appointment_date) ?? [];
      list.push(appt);
      map.set(appt.appointment_date, list);
    }
    return map;
  }, [appointments, hidden]);

  const blocksByDate = useMemo(() => {
    const map = new Map<string, FlatBlock[]>();
    if (hidden.has("BLOCKED")) return map;
    for (const block of blocks) {
      const list = map.get(block.date) ?? [];
      list.push(block);
      map.set(block.date, list);
    }
    return map;
  }, [blocks, hidden]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map(({ key, label, dot }) => {
          const isHidden = hidden.has(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggle(key)}
              aria-pressed={!isHidden}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                isHidden
                  ? "border-neutral-200 bg-white text-neutral-400"
                  : "border-transparent bg-neutral-100 text-neutral-700",
              )}
            >
              <span className={cn("h-2 w-2 rounded-full", isHidden ? "bg-neutral-300" : dot)} />
              {label}
            </button>
          );
        })}
      </div>

      <div className={cn("grid gap-3", days.length > 1 && "sm:grid-cols-2 lg:grid-cols-7")}>
        {days.map((day) => (
          <AgendaDayCard
            key={day}
            slug={slug}
            dateISO={day}
            isToday={day === todayISO}
            isClosed={closedDays.includes(day)}
            appointments={appointmentsByDate.get(day) ?? []}
            blocks={blocksByDate.get(day) ?? []}
          />
        ))}
      </div>
    </div>
  );
}

function AgendaDayCard({
  slug,
  dateISO,
  isToday,
  isClosed,
  appointments,
  blocks,
}: {
  slug: string;
  dateISO: string;
  isToday: boolean;
  isClosed: boolean;
  appointments: (AgendaAppointment & { appointment_date: string })[];
  blocks: FlatBlock[];
}) {
  const label = format(new Date(`${dateISO}T12:00:00Z`), "EEE · d MMM", { locale: ptBR });
  const isEmpty = !isClosed && appointments.length === 0 && blocks.length === 0;

  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</p>
        {isClosed && (
          <span className="shrink-0 rounded-full bg-neutral-200 px-2 py-0.5 text-[10px] font-semibold text-neutral-600">
            FECHADO
          </span>
        )}
        {!isClosed && isToday && (
          <span className="shrink-0 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-700">
            HOJE
          </span>
        )}
      </div>

      {isClosed ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-neutral-300 bg-neutral-100 py-6 text-center">
          <Store className="h-5 w-5 text-neutral-400" />
          <p className="text-xs text-neutral-500">
            Estúdio fechado
            <br />
            Sem atendimento nesse dia.
          </p>
        </div>
      ) : isEmpty ? (
        <div className="flex flex-col items-center gap-2 rounded-xl bg-neutral-50 py-6 text-center">
          <Sparkles className="h-5 w-5 text-neutral-400" />
          <p className="text-xs text-neutral-500">Dia livre — que tal criar um horário?</p>
          <Link
            href={`/${slug}/admin/agenda?view=dia&data=${dateISO}`}
            className="rounded-full border border-rose-300 px-3 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50"
          >
            + Criar agendamento
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {blocks.map((block, i) => (
            <div
              key={i}
              className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-600"
            >
              🔒 Bloqueado ({formatSaoPauloDateTime(block.startsAt).time}–
              {formatSaoPauloDateTime(block.endsAt).time})
              {block.reason && <span className="block text-neutral-500">Motivo: {block.reason}</span>}
            </div>
          ))}
          {appointments.map((appt) => (
            <AppointmentCard key={appt.id} slug={slug} appointment={appt} />
          ))}
        </div>
      )}
    </div>
  );
}
