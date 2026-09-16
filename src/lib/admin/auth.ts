import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Tenant } from "@/types/database";

/**
 * Confirms the logged-in user is staff of THIS tenant (matched by slug),
 * not just "logged in somewhere". The middleware already blocks anonymous
 * visitors from /[slug]/admin/*, but it doesn't know which tenant a
 * session belongs to — without this check, a staff member of Salon A
 * typing Salon B's slug in the URL would land on an empty (but not
 * explicitly denied) dashboard, because RLS quietly returns zero rows for
 * data that isn't theirs. This turns that confusing silence into a clear
 * redirect.
 */
export async function requireTenantStaff(
  slug: string,
): Promise<{ tenant: Tenant; profile: Profile }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/${slug}/admin/login`);

  const { data: tenant } = await supabase
    .from("tenants")
    .select("*")
    .eq("slug", slug)
    .maybeSingle<Tenant>();

  if (!tenant) redirect(`/${slug}/admin/login`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  if (!profile || profile.tenant_id !== tenant.id) {
    await supabase.auth.signOut();
    redirect(`/${slug}/admin/login?erro=sem_acesso`);
  }

  return { tenant, profile };
}

/**
 * Guards /painel-mestre, the internal tool used to onboard new salons.
 * There's no tenant here — access is decided purely by whether the
 * logged-in user's email is in PLATFORM_ADMIN_EMAILS (comma-separated),
 * since this is a single-operator platform, not a per-tenant role.
 */
export async function requirePlatformAdmin(): Promise<{ email: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/painel-mestre/login");

  const allowedEmails = (process.env.PLATFORM_ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  if (!user.email || !allowedEmails.includes(user.email.toLowerCase())) {
    await supabase.auth.signOut();
    redirect("/painel-mestre/login?erro=sem_acesso");
  }

  return { email: user.email };
}
