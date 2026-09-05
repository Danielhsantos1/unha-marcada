import { requireTenantStaff } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { AvailabilityEditor } from "@/components/admin/availability-editor";
import { BlockedDatesManager } from "@/components/admin/blocked-dates-manager";
import type { Availability, BlockedDate } from "@/types/database";

export default async function ConfiguracoesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { tenant } = await requireTenantStaff(slug);
  const supabase = await createClient();

  const [{ data: availability }, { data: blockedDates }] = await Promise.all([
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
  ]);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-semibold text-neutral-900">Configurações</h1>
      <AvailabilityEditor slug={slug} availability={availability ?? []} />
      <BlockedDatesManager slug={slug} blockedDates={blockedDates ?? []} />
    </div>
  );
}
