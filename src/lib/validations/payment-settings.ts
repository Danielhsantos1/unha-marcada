import { z } from "zod";

export const paymentSettingsFormSchema = z.object({
  mercadopagoAccessToken: z
    .string()
    .trim()
    .min(20, "Access Token inválido. Copie o valor completo do painel do Mercado Pago."),
  mercadopagoWebhookSecret: z
    .string()
    .trim()
    .min(10, "Assinatura secreta inválida. Copie o valor completo do painel do Mercado Pago."),
});

export type PaymentSettingsFormInput = z.infer<typeof paymentSettingsFormSchema>;
