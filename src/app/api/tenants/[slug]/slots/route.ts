import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAvailableSlots } from "@/lib/booking/availability";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const serviceId = searchParams.get("serviceId");
  const date = searchParams.get("date");
  const excludeAppointmentId = searchParams.get("excludeAppointmentId") ?? undefined;

  if (!serviceId || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Parâmetros inválidos." }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (!tenant) {
    return NextResponse.json({ error: "Salão não encontrado." }, { status: 404 });
  }

  const { data: service } = await supabase
    .from("services")
    .select("duration_minutes")
    .eq("id", serviceId)
    .eq("tenant_id", tenant.id)
    .eq("is_active", true)
    .maybeSingle();

  if (!service) {
    return NextResponse.json({ error: "Serviço não encontrado." }, { status: 404 });
  }

  const slots = await getAvailableSlots(
    tenant.id,
    date,
    service.duration_minutes,
    excludeAppointmentId,
  );

  return NextResponse.json({ slots });
}
