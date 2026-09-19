"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireTenantStaff } from "@/lib/admin/auth";
import { getAvailableSlots, timeStringToMinutes, minutesToTimeString } from "@/lib/booking/availability";
import { manualAppointmentFormSchema } from "@/lib/validations/manual-appointment";
import type { AppointmentPaymentSummary, Service } from "@/types/database";

/**
 * Agendamento criado pela própria dona do salão (cliente que ligou ou
 * chegou sem marcar pelo site) — entra direto como CONFIRMED, sem sinal
 * via PIX. O pagamento é combinado por fora; se ficar pendente, já cai
 * naturalmente em Contas a Receber quando o atendimento for finalizado,
 * do mesmo jeito que um saldo restante não pago funciona hoje.
 */
export async function createManualAppointmentAction(slug: string, formData: unknown) {
  const parsed = manualAppointmentFormSchema.safeParse(formData);
  if (!parsed.success) return { error: "Dados inválidos." };

  const { tenant } = await requireTenantStaff(slug);
  const input = parsed.data;
  const supabase = await createClient();

  const { data: service } = await supabase
    .from("services")
    .select("*")
    .eq("id", input.serviceId)
    .eq("tenant_id", tenant.id)
    .eq("is_active", true)
    .maybeSingle<Service>();

  if (!service) return { error: "Serviço não encontrado." };

  // Mesma checagem server-side do fluxo público — nunca confia no horário
  // que veio do formulário sem recalcular.
  const availableSlots = await getAvailableSlots(
    tenant.id,
    input.date,
    service.duration_minutes,
    undefined,
    tenant.buffer_minutes,
  );
  if (!availableSlots.includes(input.time)) {
    return { error: "Este horário não está mais disponível. Escolha outro." };
  }

  const startMinutes = timeStringToMinutes(input.time);
  const endTime = `${minutesToTimeString(startMinutes + service.duration_minutes)}:00`;
  const startTime = `${input.time}:00`;

  const { error } = await supabase.from("appointments").insert({
    tenant_id: tenant.id,
    service_id: service.id,
    client_name: input.clientName,
    client_phone: input.clientPhone,
    client_email: input.clientEmail ?? null,
    client_notes: input.clientNotes ?? null,
    appointment_date: input.date,
    start_time: startTime,
    end_time: endTime,
    status: "CONFIRMED",
    total_price_cents: service.price_cents,
    deposit_amount_cents: 0,
    hold_expires_at: new Date().toISOString(),
  });

  if (error) {
    // 23505 = unique_violation: alguém marcou esse horário exato entre a
    // checagem acima e o insert.
    if (error.code === "23505") {
      return { error: "Este horário acabou de ser reservado. Escolha outro." };
    }
    return { error: "Não foi possível criar o agendamento." };
  }

  revalidatePath(`/${slug}/admin/agenda`);
  revalidatePath(`/${slug}/admin`);
  return { error: null };
}

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
