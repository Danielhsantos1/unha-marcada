import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { BookingWizard } from "@/components/booking/booking-wizard";
import type { Availability, Service, Tenant } from "@/types/database";

export default async function AgendarPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const { slug } = await params;
  const { preview } = await searchParams;
  const supabase = await createClient();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle<Tenant>();

  if (!tenant) notFound();

  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("tenant_id", tenant.id)
    .eq("is_active", true)
    .order("display_order")
    .returns<Service[]>();

  const { data: availability } = await supabase
    .from("availability")
    .select("day_of_week")
    .eq("tenant_id", tenant.id)
    .eq("is_active", true)
    .returns<Pick<Availability, "day_of_week">[]>();

  const openWeekdays = (availability ?? []).map((row) => row.day_of_week);

  return (
    <>
      {preview === "admin" && (
        <Link
          href={`/${slug}/admin`}
          className="flex items-center justify-center gap-1.5 bg-neutral-900 px-4 py-2 text-xs font-medium text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Você está vendo como o cliente vê — voltar ao painel
        </Link>
      )}
      <BookingWizard tenantSlug={tenant.slug} services={services ?? []} openWeekdays={openWeekdays} />
    </>
  );
}
