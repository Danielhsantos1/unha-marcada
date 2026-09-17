"use server";

import crypto from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePlatformAdmin } from "@/lib/admin/auth";
import { newTenantFormSchema } from "@/lib/validations/new-tenant";

// Excludes visually ambiguous characters (0/O, 1/l/I) since this password
// gets read aloud or retyped by hand when it's relayed to the salon owner.
const PASSWORD_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";

function generateTempPassword(length = 14): string {
  return Array.from(crypto.randomFillSync(new Uint8Array(length)))
    .map((byte) => PASSWORD_CHARS[byte % PASSWORD_CHARS.length])
    .join("");
}

export interface CreateSalonResult {
  error: string | null;
  data?: {
    slug: string;
    ownerEmail: string;
    tempPassword: string;
  };
}

/**
 * Does, in one shot, everything the README used to ask the operator to do
 * by hand in the Supabase SQL Editor: create the tenant row, create the
 * owner's login (with a generated password, since there's no invite-email
 * flow built yet — the operator relays it to the owner directly), and
 * link the two through `profiles`. Any failure after the tenant insert
 * rolls back what was already created so retrying doesn't leave orphans.
 */
export async function createSalonAction(formData: unknown): Promise<CreateSalonResult> {
  await requirePlatformAdmin();

  const parsed = newTenantFormSchema.safeParse(formData);
  if (!parsed.success) return { error: "Dados inválidos." };

  const input = parsed.data;
  const supabase = createAdminClient();

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .insert({
      slug: input.slug,
      name: input.salonName,
      phone: input.phone || null,
      primary_color: input.primaryColor || "#D9A5B3",
    })
    .select("id, slug")
    .single();

  if (tenantError) {
    if (tenantError.code === "23505") {
      return { error: "Já existe um salão com esse slug." };
    }
    return { error: "Não foi possível criar o salão." };
  }

  const tempPassword = generateTempPassword();

  const { data: created, error: userError } = await supabase.auth.admin.createUser({
    email: input.ownerEmail,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name: input.ownerName },
  });

  if (userError || !created.user) {
    await supabase.from("tenants").delete().eq("id", tenant.id);
    return { error: userError?.message ?? "Não foi possível criar o login da responsável." };
  }

  const { error: profileError } = await supabase.from("profiles").insert({
    id: created.user.id,
    tenant_id: tenant.id,
    role: "owner",
    full_name: input.ownerName,
  });

  if (profileError) {
    await supabase.auth.admin.deleteUser(created.user.id);
    await supabase.from("tenants").delete().eq("id", tenant.id);
    return { error: "Não foi possível vincular o login ao salão." };
  }

  revalidatePath("/painel-mestre");

  return {
    error: null,
    data: {
      slug: tenant.slug,
      ownerEmail: input.ownerEmail,
      tempPassword,
    },
  };
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
