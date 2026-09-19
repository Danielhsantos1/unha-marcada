import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
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

  const { data: availability } = await supabase
    .from("availability")
    .select("day_of_week")
    .eq("tenant_id", tenant.id)
    .eq("is_active", true);

  const openWeekdays = (availability ?? []).map((row) => row.day_of_week);

  return NextResponse.json({ openWeekdays });
}
