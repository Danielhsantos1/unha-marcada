import "server-only";
import crypto from "node:crypto";
import { MercadoPagoConfig, Payment } from "mercadopago";

export interface CreatePixPaymentInput {
  amountCents: number;
  description: string;
  payerEmail?: string;
  payerFirstName: string;
  externalReference: string;
  notificationUrl: string;
}

export interface CreatePixPaymentResult {
  providerPaymentId: string;
  qrCode: string;
  qrCodeBase64: string;
}

/**
 * Mercado Pago requires a payer email for PIX. Most beauty-salon clients
 * won't have one on hand (the form marks email as opcional), so we fall
 * back to a synthetic address built from their phone number. It's accepted
 * by the PIX flow; if you want Mercado Pago's own email receipts to work,
 * make the email field required in the booking form instead.
 */
function resolvePayerEmail(email: string | undefined, phone: string): string {
  if (email) return email;
  const digits = phone.replace(/\D/g, "");
  return `cliente-${digits}@sem-email.booking`;
}

/**
 * Every call takes the tenant's OWN Mercado Pago access token — there is no
 * global/platform credential. Each salon connects its own Mercado Pago
 * account (see tenant_payment_credentials) so PIX deposits land directly in
 * its account, never in the platform's.
 */
export async function createPixPayment(
  input: CreatePixPaymentInput & { payerPhone: string },
  accessToken: string,
): Promise<CreatePixPaymentResult> {
  const payment = new Payment(new MercadoPagoConfig({ accessToken }));

  const result = await payment.create({
    body: {
      transaction_amount: Math.round(input.amountCents) / 100,
      description: input.description,
      payment_method_id: "pix",
      external_reference: input.externalReference,
      notification_url: input.notificationUrl,
      payer: {
        email: resolvePayerEmail(input.payerEmail, input.payerPhone),
        first_name: input.payerFirstName,
      },
    },
  });

  const transactionData = result.point_of_interaction?.transaction_data;

  if (!result.id || !transactionData?.qr_code || !transactionData?.qr_code_base64) {
    throw new Error("Mercado Pago não retornou os dados do PIX.");
  }

  return {
    providerPaymentId: String(result.id),
    qrCode: transactionData.qr_code,
    qrCodeBase64: transactionData.qr_code_base64,
  };
}

export async function getPaymentStatus(providerPaymentId: string, accessToken: string) {
  const payment = new Payment(new MercadoPagoConfig({ accessToken }));
  return payment.get({ id: providerPaymentId });
}

/**
 * Validates the `x-signature` header Mercado Pago sends on every webhook
 * call, per https://www.mercadopago.com.br/developers/en/docs/checkout-api/webhooks#editor_5
 * Without this, anyone could POST a fake "payment approved" event.
 *
 * The secret is per-tenant: each salon's own Mercado Pago application has
 * its own webhook signing secret, generated in its own developer panel.
 */
export function verifyWebhookSignature(params: {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string | null;
  secret: string;
}): boolean {
  if (!params.secret || !params.xSignature || !params.xRequestId || !params.dataId) {
    return false;
  }

  const parts = Object.fromEntries(
    params.xSignature.split(",").map((part) => {
      const [key, value] = part.split("=");
      return [key?.trim(), value?.trim()];
    }),
  );

  const ts = parts["ts"];
  const receivedHash = parts["v1"];
  if (!ts || !receivedHash) return false;

  const manifest = `id:${params.dataId.toLowerCase()};request-id:${params.xRequestId};ts:${ts};`;
  const expectedHash = crypto.createHmac("sha256", params.secret).update(manifest).digest("hex");
  const expectedBuffer = Buffer.from(expectedHash);
  const receivedBuffer = Buffer.from(receivedHash);

  if (expectedBuffer.length !== receivedBuffer.length) return false;
  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}
