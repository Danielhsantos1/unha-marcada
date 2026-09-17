import type { AppointmentStatus } from "@/types/database";

export type FinancialStatus =
  | "AGUARDANDO_SINAL"
  | "SINAL_RECEBIDO"
  | "SALDO_PENDENTE"
  | "QUITADO"
  | "CANCELADO";

/**
 * The one place this gets decided. Order matters: QUITADO wins over
 * everything else the moment amountReceived >= total — never show a
 * pending balance (or ask to collect one) once a client has fully paid,
 * even if the appointment happens to also be CANCELLED/COMPLETED.
 */
export function computeFinancialStatus(params: {
  appointmentStatus: AppointmentStatus;
  totalPriceCents: number;
  amountReceivedCents: number;
}): FinancialStatus {
  const { appointmentStatus, totalPriceCents, amountReceivedCents } = params;

  if (amountReceivedCents >= totalPriceCents) return "QUITADO";
  if (appointmentStatus === "CANCELLED" || appointmentStatus === "EXPIRED") return "CANCELADO";
  if (appointmentStatus === "COMPLETED") return "SALDO_PENDENTE";
  if (amountReceivedCents > 0) return "SINAL_RECEBIDO";
  return "AGUARDANDO_SINAL";
}

export const FINANCIAL_STATUS_LABELS: Record<FinancialStatus, string> = {
  AGUARDANDO_SINAL: "🟡 Aguardando Sinal",
  SINAL_RECEBIDO: "🟠 Sinal Recebido",
  SALDO_PENDENTE: "🔵 Saldo Pendente",
  QUITADO: "🟢 Quitado",
  CANCELADO: "🔴 Cancelado",
};

export const FINANCIAL_STATUS_COLORS: Record<FinancialStatus, string> = {
  AGUARDANDO_SINAL: "bg-amber-100 text-amber-800 border-amber-300",
  SINAL_RECEBIDO: "bg-orange-100 text-orange-800 border-orange-300",
  SALDO_PENDENTE: "bg-blue-100 text-blue-800 border-blue-300",
  QUITADO: "bg-emerald-100 text-emerald-800 border-emerald-300",
  CANCELADO: "bg-red-100 text-red-800 border-red-300",
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  PIX: "PIX",
  DINHEIRO: "Dinheiro",
  CARTAO_DEBITO: "Cartão de débito",
  CARTAO_CREDITO: "Cartão de crédito",
  OUTRO: "Outro",
};

export const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  SINAL: "Sinal recebido",
  PAGAMENTO_FINAL: "Pagamento final",
  ESTORNO: "Estorno",
};
