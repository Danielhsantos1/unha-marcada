import "server-only";
import crypto from "node:crypto";
import { MercadoPagoConfig, Payment } from "mercadopago";

function getClient(): MercadoPagoConfig {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado.");
  }
  return new MercadoPagoConfig({ accessToken });
}

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

export async function createPixPayment(
  input: CreatePixPaymentInput & { payerPhone: string },
): Promise<CreatePixPaymentResult> {
  const payment = new Payment(getClient());

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

export async function getPaymentStatus(providerPaymentId: string) {
  const payment = new Payment(getClient());
  return payment.get({ id: providerPaymentId });
}

/**
 * Validates the `x-signature` header Mercado Pago sends on every webhook
 * call, per https://www.mercadopago.com.br/developers/en/docs/checkout-api/webhooks#editor_5
 * Without this, anyone could POST a fake "payment approved" event.
 */
export function verifyWebhookSignature(params: {
  xSignature: string | null;
  xRequestId: string | null;
  dataId: string | null;
}): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret || !params.xSignature || !params.xRequestId || !params.dataId) {
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
  const expectedHash = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
  const expectedBuffer = Buffer.from(expectedHash);
  const receivedBuffer = Buffer.from(receivedHash);

  if (expectedBuffer.length !== receivedBuffer.length) return false;
  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}
