"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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

export async function markAppointmentCompletedAction(slug: string, appointmentId: string) {
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
  return { error: null };
}
