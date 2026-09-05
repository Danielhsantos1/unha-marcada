import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatDateBR(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

export function formatTimeBR(time: string): string {
  return time.slice(0, 5);
}

const TENANT_TZ_OFFSET_MS = -3 * 60 * 60_000;

/**
 * Renders a timestamptz value (which Supabase always returns in UTC) as
 * the salon's local wall-clock date/time. Same fixed America/Sao_Paulo
 * assumption as `lib/booking/availability.ts` — see the comment there.
 */
export function formatSaoPauloDateTime(isoString: string): { date: string; time: string } {
  const local = new Date(new Date(isoString).getTime() + TENANT_TZ_OFFSET_MS);
  return {
    date: local.toISOString().slice(0, 10),
    time: local.toISOString().slice(11, 16),
  };
}
