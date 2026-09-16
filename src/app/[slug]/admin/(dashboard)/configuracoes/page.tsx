import { requireTenantStaff } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { AvailabilityEditor } from "@/components/admin/availability-editor";
import { BlockedDatesManager } from "@/components/admin/blocked-dates-manager";
import { PaymentSettingsForm } from "@/components/admin/payment-settings-form";
import type { Availability, BlockedDate, TenantPaymentCredentials } from "@/types/database";

export default async function ConfiguracoesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { tenant } = await requireTenantStaff(slug);
  const supabase = await createClient();

  const [{ data: availability }, { data: blockedDates }, { data: credentials }] =
    await Promise.all([
      supabase
        .from("availability")
        .select("*")
        .eq("tenant_id", tenant.id)
        .returns<Availability[]>(),
      supabase
        .from("blocked_dates")
        .select("*")
        .eq("tenant_id", tenant.id)
        .gte("ends_at", new Date().toISOString())
        .order("starts_at")
        .returns<BlockedDate[]>(),
      supabase
        .from("tenant_payment_credentials")
        .select("mercadopago_access_token")
        .eq("tenant_id", tenant.id)
        .maybeSingle<Pick<TenantPaymentCredentials, "mercadopago_access_token">>(),
    ]);

  const maskedAccessToken = credentials
    ? `•••• ${credentials.mercadopago_access_token.slice(-4)}`
    : null;

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-semibold text-neutral-900">Configurações</h1>
      <PaymentSettingsForm
        slug={slug}
        configured={!!credentials}
        maskedAccessToken={maskedAccessToken}
      />
      <AvailabilityEditor slug={slug} availability={availability ?? []} />
      <BlockedDatesManager slug={slug} blockedDates={blockedDates ?? []} />
    </div>
  );
}
