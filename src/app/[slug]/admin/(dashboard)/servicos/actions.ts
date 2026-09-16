"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { serviceFormSchema } from "@/lib/validations/service";
import { requireTenantStaff } from "@/lib/admin/auth";

export async function createServiceAction(slug: string, formData: unknown) {
  const parsed = serviceFormSchema.safeParse(formData);
  if (!parsed.success) return { error: "Dados inválidos." };

  const { tenant } = await requireTenantStaff(slug);
  const supabase = await createClient();

  const { error } = await supabase.from("services").insert({
    tenant_id: tenant.id,
    category: parsed.data.category,
    name: parsed.data.name,
    description: parsed.data.description || null,
    price_cents: Math.round(parsed.data.price * 100),
    duration_minutes: parsed.data.duration_minutes,
    deposit_percentage: parsed.data.deposit_percentage,
  });

  if (error) return { error: "Não foi possível criar o serviço." };

  revalidatePath(`/${slug}/admin/servicos`);
  return { error: null };
}

export async function updateServiceAction(slug: string, serviceId: string, formData: unknown) {
  const parsed = serviceFormSchema.safeParse(formData);
  if (!parsed.success) return { error: "Dados inválidos." };

  const supabase = await createClient();

  const { error } = await supabase
    .from("services")
    .update({
      category: parsed.data.category,
      name: parsed.data.name,
      description: parsed.data.description || null,
      price_cents: Math.round(parsed.data.price * 100),
      duration_minutes: parsed.data.duration_minutes,
      deposit_percentage: parsed.data.deposit_percentage,
    })
    .eq("id", serviceId);

  if (error) return { error: "Não foi possível atualizar o serviço." };

  revalidatePath(`/${slug}/admin/servicos`);
  return { error: null };
}

export async function toggleServiceActiveAction(slug: string, serviceId: string, isActive: boolean) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("services")
    .update({ is_active: isActive })
    .eq("id", serviceId);

  if (error) return { error: "Não foi possível atualizar o serviço." };

  revalidatePath(`/${slug}/admin/servicos`);
  return { error: null };
}
