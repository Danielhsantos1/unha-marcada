import { z } from "zod";

export const newTenantFormSchema = z.object({
  salonName: z.string().trim().min(1, "Obrigatório").max(120),
  slug: z
    .string()
    .trim()
    .min(2, "Muito curto")
    .max(60)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use só letras minúsculas, números e hífen."),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  primaryColor: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida (ex.: #D9A5B3).")
    .optional()
    .or(z.literal("")),
  ownerEmail: z.string().trim().email("E-mail inválido."),
  ownerName: z.string().trim().min(1, "Obrigatório").max(120),
});

export type NewTenantFormInput = z.infer<typeof newTenantFormSchema>;
