import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPaymentStatus, verifyWebhookSignature } from "@/lib/mercadopago";
import type { TenantPaymentCredentials } from "@/types/database";

/**
 * Mercado Pago calls this URL whenever a payment's status changes.
 *
 * Each salon uses its OWN Mercado Pago account, so before we can verify
 * the signature or query the payment we first need to know WHICH tenant
 * this notification belongs to. We resolve that from our own `payments`
 * row (matched by the provider_payment_id we stored when the PIX charge
 * was created), then use that tenant's own webhook secret and access
 * token for everything else. We never trust the webhook body's status
 * directly — always confirm with the source of truth (Mercado Pago's API).
 */
export async function POST(request: Request) {
  const url = new URL(request.url);
  const dataId = url.searchParams.get("data.id") ?? url.searchParams.get("id");

  if (!dataId) {
    return NextResponse.json({ error: "data.id ausente." }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: paymentRow } = await supabase
    .from("payments")
    .select("tenant_id, appointment_id")
    .eq("provider_payment_id", dataId)
    .maybeSingle<{ tenant_id: string; appointment_id: string }>();

  if (!paymentRow) {
    return NextResponse.json({ error: "Pagamento não encontrado." }, { status: 404 });
  }

  const { data: credentials } = await supabase
    .from("tenant_payment_credentials")
    .select("mercadopago_access_token, mercadopago_webhook_secret")
    .eq("tenant_id", paymentRow.tenant_id)
    .maybeSingle<
      Pick<TenantPaymentCredentials, "mercadopago_access_token" | "mercadopago_webhook_secret">
    >();

  if (!credentials) {
    return NextResponse.json({ error: "Credenciais do salão não encontradas." }, { status: 404 });
  }

  const isValid = verifyWebhookSignature({
    xSignature: request.headers.get("x-signature"),
    xRequestId: request.headers.get("x-request-id"),
    dataId,
    secret: credentials.mercadopago_webhook_secret,
  });

  if (!isValid) {
    return NextResponse.json({ error: "Assinatura inválida." }, { status: 401 });
  }

  const mpPayment = await getPaymentStatus(dataId, credentials.mercadopago_access_token);
  const appointmentId = mpPayment.external_reference;

  if (!appointmentId) {
    return NextResponse.json({ error: "external_reference ausente." }, { status: 400 });
  }

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
    .eq("appointment_id", appointmentId)
    .eq("tenant_id", paymentRow.tenant_id);

  if (newStatus === "PAID") {
    // Only flip a still-pending hold — never resurrect an EXPIRED/CANCELLED
    // appointment just because a late webhook arrived.
    await supabase
      .from("appointments")
      .update({ status: "CONFIRMED" })
      .eq("id", appointmentId)
      .eq("tenant_id", paymentRow.tenant_id)
      .eq("status", "PENDING_PAYMENT");
  } else if (newStatus === "FAILED") {
    await supabase
      .from("appointments")
      .update({ status: "CANCELLED", cancelled_reason: "Pagamento PIX recusado ou cancelado." })
      .eq("id", appointmentId)
      .eq("tenant_id", paymentRow.tenant_id)
      .eq("status", "PENDING_PAYMENT");
  }

  return NextResponse.json({ received: true });
}
