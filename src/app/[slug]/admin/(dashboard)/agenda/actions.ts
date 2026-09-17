"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { AppointmentPaymentSummary } from "@/types/database";

export async function cancelAppointmentAction(slug: string, appointmentId: string, reason: string) {
  const supabase = await createClient();

  // RLS (`staff can manage appointments`) already scopes this update to the
  // caller's own tenant — no need to re-check tenant_id here.
  const { error } = await supabase
    .from("appointments")
    .update({ status: "CANCELLED", cancelled_reason: reason || "Cancelado pelo salão." })
    .eq("id", appointmentId)
    .in("status", ["PENDING_PAYMENT", "CONFIRMED"]);

  if (error) {
    return { error: "Não foi possível cancelar o agendamento." };
  }

  revalidatePath(`/${slug}/admin/agenda`);
  return { error: null };
}

/**
 * "Finalizar Atendimento". Never completes silently past a pending
 * balance — checks it first and hands the amount back so the UI can show
 * the mandatory "existe saldo pendente, quer cobrar agora?" prompt
 * instead of just marking done and letting the charge get forgotten.
 * Use forceCompleteAppointmentAction to actually flip the status once
 * the staff member has decided (paid now, or "lembrar depois").
 */
export async function markAppointmentCompletedAction(slug: string, appointmentId: string) {
  const supabase = await createClient();

  const { data: summary } = await supabase
    .from("appointment_payment_summary")
    .select("balance_due_cents")
    .eq("appointment_id", appointmentId)
    .maybeSingle<Pick<AppointmentPaymentSummary, "balance_due_cents">>();

  if (summary && summary.balance_due_cents > 0) {
    return { error: null, pendingBalanceCents: summary.balance_due_cents };
  }

  return forceCompleteAppointmentAction(slug, appointmentId);
}

export async function forceCompleteAppointmentAction(slug: string, appointmentId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("appointments")
    .update({ status: "COMPLETED" })
    .eq("id", appointmentId)
    .eq("status", "CONFIRMED");

  if (error) {
    return { error: "Não foi possível concluir o agendamento." };
  }

  revalidatePath(`/${slug}/admin/agenda`);
  revalidatePath(`/${slug}/admin/pagamentos`);
  revalidatePath(`/${slug}/admin/contas-a-receber`);
  revalidatePath(`/${slug}/admin`);
  return { error: null, pendingBalanceCents: 0 };
}
