import type { AppointmentStatus, PaymentStatus, ServiceCategory } from "@/types/database";

/** How long a client has to pay the PIX deposit before the slot is released. */
export const HOLD_DURATION_MINUTES = 15;

export const SERVICE_CATEGORY_LABELS: Record<ServiceCategory, string> = {
  maos: "Mãos",
  pes: "Pés",
  combo: "Combos",
};

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  PENDING_PAYMENT: "Aguardando pagamento",
  CONFIRMED: "Confirmado",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
  EXPIRED: "Expirado",
};

/** Tailwind classes for each status, used across the admin agenda. */
export const APPOINTMENT_STATUS_COLORS: Record<AppointmentStatus, string> = {
  PENDING_PAYMENT: "bg-amber-100 text-amber-800 border-amber-300",
  CONFIRMED: "bg-emerald-100 text-emerald-800 border-emerald-300",
  COMPLETED: "bg-blue-100 text-blue-800 border-blue-300",
  CANCELLED: "bg-red-100 text-red-800 border-red-300",
  EXPIRED: "bg-neutral-200 text-neutral-600 border-neutral-300",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: "Pendente",
  PAID: "Pago",
  FAILED: "Falhou",
  REFUNDED: "Reembolsado",
};

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800 border-amber-300",
  PAID: "bg-emerald-100 text-emerald-800 border-emerald-300",
  FAILED: "bg-red-100 text-red-800 border-red-300",
  REFUNDED: "bg-neutral-200 text-neutral-600 border-neutral-300",
};

export const WEEKDAY_LABELS = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];
