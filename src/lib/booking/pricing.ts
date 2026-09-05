import type { Service } from "@/types/database";

/**
 * Computes the deposit (sinal) amount for a service, rounded to the nearest
 * cent. Never trust a deposit amount sent from the client — always
 * recompute it server-side from the service's stored price/percentage.
 */
export function calculateDepositCents(service: Pick<Service, "price_cents" | "deposit_percentage">): number {
  return Math.round((service.price_cents * service.deposit_percentage) / 100);
}
