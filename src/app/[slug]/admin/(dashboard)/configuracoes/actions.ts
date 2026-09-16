"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireTenantStaff } from "@/lib/admin/auth";
import { blockedDateFormSchema } from "@/lib/validations/blocked-date";
import { paymentSettingsFormSchema } from "@/lib/validations/payment-settings";

export interface AvailabilityRowInput {
  dayOfWeek: number;
  isOpen: boolean;
  startTime: string;
  endTime: string;
}

export async function saveAvailabilityAction(slug: string, rows: AvailabilityRowInput[]) {
  const { tenant } = await requireTenantStaff(slug);
  const supabase = await createClient();

  const invalid = rows.some((row) => row.isOpen && row.startTime >= row.endTime);
  if (invalid) return { error: "O horário final deve ser depois do inicial." };

  const { error: deleteError } = await supabase
    .from("availability")
    .delete()
    .eq("tenant_id", tenant.id);

  if (deleteError) return { error: "Não foi possível salvar os horários." };

  const openRows = rows.filter((row) => row.isOpen);
  if (openRows.length > 0) {
    const { error: insertError } = await supabase.from("availability").insert(
      openRows.map((row) => ({
        tenant_id: tenant.id,
        day_of_week: row.dayOfWeek,
        start_time: `${row.startTime}:00`,
        end_time: `${row.endTime}:00`,
        is_active: true,
      })),
    );
    if (insertError) return { error: "Não foi possível salvar os horários." };
  }

  revalidatePath(`/${slug}/admin/configuracoes`);
  return { error: null };
}

export async function createBlockedDateAction(slug: string, formData: unknown) {
  const parsed = blockedDateFormSchema.safeParse(formData);
  if (!parsed.success) return { error: "Dados inválidos." };

  const { tenant, profile } = await requireTenantStaff(slug);
  const supabase = await createClient();

  const { error } = await supabase.from("blocked_dates").insert({
    tenant_id: tenant.id,
    starts_at: `${parsed.data.startDate}T${parsed.data.startTime}:00-03:00`,
    ends_at: `${parsed.data.endDate}T${parsed.data.endTime}:00-03:00`,
    reason: parsed.data.reason || null,
    created_by: profile.id,
  });

  if (error) return { error: "Não foi possível bloquear o horário." };

  revalidatePath(`/${slug}/admin/configuracoes`);
  return { error: null };
}

export async function deleteBlockedDateAction(slug: string, blockId: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("blocked_dates").delete().eq("id", blockId);
  if (error) return { error: "Não foi possível remover o bloqueio." };

  revalidatePath(`/${slug}/admin/configuracoes`);
  return { error: null };
}

export async function savePaymentCredentialsAction(slug: string, formData: unknown) {
  const parsed = paymentSettingsFormSchema.safeParse(formData);
  if (!parsed.success) return { error: "Dados inválidos." };

  const { tenant } = await requireTenantStaff(slug);
  const supabase = await createClient();

  const { error } = await supabase.from("tenant_payment_credentials").upsert({
    tenant_id: tenant.id,
    mercadopago_access_token: parsed.data.mercadopagoAccessToken,
    mercadopago_webhook_secret: parsed.data.mercadopagoWebhookSecret,
  });

  if (error) return { error: "Não foi possível salvar as credenciais." };

  revalidatePath(`/${slug}/admin/configuracoes`);
  return { error: null };
}
