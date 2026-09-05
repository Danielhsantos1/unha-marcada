import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPaymentStatus, verifyWebhookSignature } from "@/lib/mercadopago";

/**
 * Mercado Pago calls this URL whenever a payment's status changes.
 * We verify the signature, look the payment up on Mercado Pago's own API
 * (never trust the webhook body's status directly — always confirm with
 * the source of truth), then update our local rows.
 */
export async function POST(request: Request) {
  const url = new URL(request.url);
  const dataId = url.searchParams.get("data.id") ?? url.searchParams.get("id");

  const isValid = verifyWebhookSignature({
    xSignature: request.headers.get("x-signature"),
    xRequestId: request.headers.get("x-request-id"),
    dataId,
  });

  if (!isValid) {
    return NextResponse.json({ error: "Assinatura inválida." }, { status: 401 });
  }

  if (!dataId) {
    return NextResponse.json({ error: "data.id ausente." }, { status: 400 });
  }

  const mpPayment = await getPaymentStatus(dataId);
  const appointmentId = mpPayment.external_reference;

  if (!appointmentId) {
    return NextResponse.json({ error: "external_reference ausente." }, { status: 400 });
  }

  const supabase = createAdminClient();

  const newStatus =
    mpPayment.status === "approved"
      ? "PAID"
      : mpPayment.status === "rejected" || mpPayment.status === "cancelled"
        ? "FAILED"
        : "PENDING";

  await supabase
    .from("payments")
    .update({
      status: newStatus,
      provider_payment_id: String(mpPayment.id),
      raw_payload: mpPayment as unknown as Record<string, unknown>,
      paid_at: newStatus === "PAID" ? new Date().toISOString() : null,
    })
    .eq("appointment_id", appointmentId);

  if (newStatus === "PAID") {
    // Only flip a still-pending hold — never resurrect an EXPIRED/CANCELLED
    // appointment just because a late webhook arrived.
    await supabase
      .from("appointments")
      .update({ status: "CONFIRMED" })
      .eq("id", appointmentId)
      .eq("status", "PENDING_PAYMENT");
  } else if (newStatus === "FAILED") {
    await supabase
      .from("appointments")
      .update({ status: "CANCELLED", cancelled_reason: "Pagamento PIX recusado ou cancelado." })
      .eq("id", appointmentId)
      .eq("status", "PENDING_PAYMENT");
  }

  return NextResponse.json({ received: true });
}
