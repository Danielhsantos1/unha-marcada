import { z } from "zod";

export const serviceFormSchema = z.object({
  name: z.string().trim().min(1, "Obrigatório").max(120),
  category: z.enum(["maos", "pes", "combo"]),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  price: z.coerce.number().positive("Valor deve ser maior que zero"),
  duration_minutes: z.coerce.number().int().positive("Duração deve ser maior que zero"),
  deposit_percentage: z.coerce.number().min(1).max(100),
});

export type ServiceFormInput = z.infer<typeof serviceFormSchema>;
