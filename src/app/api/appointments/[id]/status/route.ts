import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Guest-facing status check. The appointment UUID itself acts as the
 * access token (same idea as a Stripe Checkout session id) — anyone who
 * has it can see this appointment's status and PIX data, nothing else.
 * We only ever return the small set of fields the payment screen needs.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: appointment } = await supabase
    .from("appointments")
    .select(
      "id, status, appointment_date, start_time, end_time, total_price_cents, deposit_amount_cents, hold_expires_at, client_name, service:services(name), tenant:tenants(slug, name)",
    )
    .eq("id", id)
    .maybeSingle();

  if (!appointment) {
    return NextResponse.json({ error: "Agendamento não encontrado." }, { status: 404 });
  }

  const { data: payment } = await supabase
    .from("payments")
    .select("status, qr_code, qr_code_base64, pix_copy_paste, expires_at, amount_cents")
    .eq("appointment_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ appointment, payment });
}
