"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePlatformAdmin } from "@/lib/admin/auth";
import { provisionTenant, type ProvisionTenantResult } from "@/lib/tenant/provision";

export type CreateSalonResult = ProvisionTenantResult;

/**
 * Does, in one shot, everything the README used to ask the operator to do
 * by hand in the Supabase SQL Editor. The actual provisioning (tenant +
 * login + profile, with rollback on failure) lives in `provisionTenant` —
 * shared with the public self-signup flow at /comecar; this wrapper only
 * adds the platform-admin gate.
 */
export async function createSalonAction(formData: unknown): Promise<CreateSalonResult> {
  await requirePlatformAdmin();

  const result = await provisionTenant(formData);
  if (!result.error) revalidatePath("/painel-mestre");
  return result;
}

/**
 * Ativa/suspende um salão — a chave pra "cliente parou de pagar a
 * mensalidade". Suspender não apaga nada: só derruba a policy pública
 * de tenants (`is_active = true`) e a checagem em /api/appointments, então
 * a página pública do salão e o link de agendar param de funcionar até
 * reativar.
 */
export async function toggleTenantActiveAction(tenantId: string, isActive: boolean) {
  await requirePlatformAdmin();

  const supabase = createAdminClient();
  const { error } = await supabase.from("tenants").update({ is_active: isActive }).eq("id", tenantId);

  if (error) return { error: "Não foi possível atualizar o status do salão." };

  revalidatePath("/painel-mestre");
  return { error: null };
}

export async function platformSignOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/painel-mestre/login");
}
