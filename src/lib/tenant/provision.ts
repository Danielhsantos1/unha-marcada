import "server-only";
import crypto from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { newTenantFormSchema } from "@/lib/validations/new-tenant";

// Excludes visually ambiguous characters (0/O, 1/l/I) since this password
// gets read aloud or retyped by hand when it's relayed to the salon owner.
const PASSWORD_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";

function generateTempPassword(length = 14): string {
  return Array.from(crypto.randomFillSync(new Uint8Array(length)))
    .map((byte) => PASSWORD_CHARS[byte % PASSWORD_CHARS.length])
    .join("");
}

export interface ProvisionTenantResult {
  error: string | null;
  data?: {
    slug: string;
    ownerEmail: string;
    tempPassword: string;
  };
}

/**
 * Creates the tenant row, the owner's Supabase Auth login (generated
 * password — there's no invite-email flow built yet) and the profile that
 * links the two. Any failure after the tenant insert rolls back what was
 * already created so retrying doesn't leave orphans.
 *
 * Shared by the platform-admin flow (painel mestre) and the public
 * self-signup flow — both just validate differently and call this the
 * same way.
 */
export async function provisionTenant(formData: unknown): Promise<ProvisionTenantResult> {
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

  return {
    error: null,
    data: {
      slug: tenant.slug,
      ownerEmail: input.ownerEmail,
      tempPassword,
    },
  };
}
