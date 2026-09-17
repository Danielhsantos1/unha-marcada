"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireTenantStaff } from "@/lib/admin/auth";
import { recordPaymentFormSchema, refundFormSchema } from "@/lib/validations/payment-transaction";
import type { AppointmentPaymentSummary, PaymentTransaction } from "@/types/database";

export interface TransactionWithAuthor extends PaymentTransaction {
  recorded_by_name: string | null;
}

/** Histórico financeiro completo de um atendimento, mais antigo primeiro. */
export async function getAppointmentTransactionsAction(
  slug: string,
  appointmentId: string,
): Promise<{ transactions: TransactionWithAuthor[]; summary: AppointmentPaymentSummary | null }> {
  await requireTenantStaff(slug);
  const supabase = await createClient();

  const [{ data: transactions }, { data: summary }] = await Promise.all([
    supabase
      .from("payment_transactions")
      .select("*, profile:profiles(full_name)")
      .eq("appointment_id", appointmentId)
      .order("recorded_at", { ascending: true })
      .returns<(PaymentTransaction & { profile: { full_name: string } | null })[]>(),
    supabase
      .from("appointment_payment_summary")
      .select("*")
      .eq("appointment_id", appointmentId)
      .maybeSingle<AppointmentPaymentSummary>(),
  ]);

  return {
    transactions: (transactions ?? []).map(({ profile, ...t }) => ({
      ...t,
      recorded_by_name: profile?.full_name ?? null,
    })),
    summary: summary ?? null,
  };
}

async function getBalance(
  supabase: Awaited<ReturnType<typeof createClient>>,
  appointmentId: string,
): Promise<Pick<AppointmentPaymentSummary, "balance_due_cents" | "total_price_cents"> | null> {
  const { data } = await supabase
    .from("appointment_payment_summary")
    .select("balance_due_cents, total_price_cents")
    .eq("appointment_id", appointmentId)
    .maybeSingle<Pick<AppointmentPaymentSummary, "balance_due_cents" | "total_price_cents">>();
  return data;
}

/**
 * "Receber Restante" — the one place a manual payment (final balance,
 * collected in person) gets written. Re-checks the balance server-side
 * right before inserting: the whole point is that a client who already
 * quitou can never be charged again, even if the button was stale on
 * screen (two tabs open, a slow connection, whatever).
 */
export async function recordPaymentAction(slug: string, appointmentId: string, formData: unknown) {
  const parsed = recordPaymentFormSchema.safeParse(formData);
  if (!parsed.success) return { error: "Dados inválidos." };

  const { tenant, profile } = await requireTenantStaff(slug);
  const supabase = await createClient();

  const balance = await getBalance(supabase, appointmentId);
  if (!balance) return { error: "Agendamento não encontrado." };
  if (balance.balance_due_cents <= 0) {
    return { error: "Este atendimento já foi quitado integralmente." };
  }

  const amountCents = Math.round(parsed.data.amount * 100);
  if (amountCents > balance.balance_due_cents) {
    return {
      error: `O valor não pode ser maior que o saldo pendente (${(balance.balance_due_cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}).`,
    };
  }

  const recordedAt = `${parsed.data.date}T${new Date().toISOString().slice(11)}`;

  const { error } = await supabase.from("payment_transactions").insert({
    tenant_id: tenant.id,
    appointment_id: appointmentId,
    type: "PAGAMENTO_FINAL",
    amount_cents: amountCents,
    method: parsed.data.method,
    note: parsed.data.note || null,
    recorded_by: profile.id,
    recorded_at: recordedAt,
  });

  if (error) return { error: "Não foi possível registrar o pagamento." };

  revalidatePath(`/${slug}/admin/pagamentos`);
  revalidatePath(`/${slug}/admin/agenda`);
  revalidatePath(`/${slug}/admin/contas-a-receber`);
  revalidatePath(`/${slug}/admin`);
  return { error: null };
}

/** Estorno controlado: nunca edita/remove a transação original, só lança o oposto. */
export async function refundTransactionAction(slug: string, transactionId: string, formData: unknown) {
  const parsed = refundFormSchema.safeParse(formData);
  if (!parsed.success) return { error: "Informe o motivo do estorno." };

  const { tenant, profile } = await requireTenantStaff(slug);
  const supabase = await createClient();

  const { data: original } = await supabase
    .from("payment_transactions")
    .select("id, appointment_id, amount_cents, type, receipt_number")
    .eq("id", transactionId)
    .maybeSingle<{
      id: string;
      appointment_id: string;
      amount_cents: number;
      type: string;
      receipt_number: number;
    }>();

  if (!original) return { error: "Transação não encontrada." };
  if (original.type === "ESTORNO") return { error: "Não é possível estornar um estorno." };

  const { error } = await supabase.from("payment_transactions").insert({
    tenant_id: tenant.id,
    appointment_id: original.appointment_id,
    type: "ESTORNO",
    amount_cents: -original.amount_cents,
    method: "OUTRO",
    note: `Estorno do comprovante nº ${original.receipt_number}: ${parsed.data.reason}`,
    recorded_by: profile.id,
  });

  if (error) return { error: "Não foi possível registrar o estorno." };

  revalidatePath(`/${slug}/admin/pagamentos`);
  revalidatePath(`/${slug}/admin/contas-a-receber`);
  revalidatePath(`/${slug}/admin`);
  return { error: null };
}
