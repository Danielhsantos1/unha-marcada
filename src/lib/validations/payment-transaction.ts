import { z } from "zod";

export const recordPaymentFormSchema = z.object({
  amount: z.coerce.number().positive("Valor deve ser maior que zero"),
  method: z.enum(["PIX", "DINHEIRO", "CARTAO_DEBITO", "CARTAO_CREDITO", "OUTRO"]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  note: z.string().trim().max(300).optional().or(z.literal("")),
});

export type RecordPaymentFormInput = z.infer<typeof recordPaymentFormSchema>;

export const refundFormSchema = z.object({
  reason: z.string().trim().min(1, "Informe o motivo do estorno").max(300),
});

export type RefundFormInput = z.infer<typeof refundFormSchema>;
