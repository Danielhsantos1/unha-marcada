import { z } from "zod";

// Basic sanitization: trim whitespace and collapse repeated spaces so
// stray input doesn't get stored verbatim in the database.
const cleanText = (max: number) =>
  z
    .string()
    .trim()
    .min(1, "Campo obrigatório")
    .max(max, `Máximo de ${max} caracteres`)
    .transform((value) => value.replace(/\s+/g, " "));

// Accepts Brazilian phone numbers with or without formatting; we store the
// digits only.
const phoneSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/\D/g, ""))
  .refine((digits) => digits.length >= 10 && digits.length <= 13, {
    message: "Informe um WhatsApp válido com DDD",
  });

export const clientInfoSchema = z.object({
  clientName: cleanText(120),
  clientPhone: phoneSchema,
  clientEmail: z
    .string()
    .trim()
    .max(160)
    .optional()
    .refine((value) => !value || z.string().email().safeParse(value).success, {
      message: "E-mail inválido",
    }),
  clientNotes: z.string().trim().max(500).optional(),
});

export type ClientInfoInput = z.infer<typeof clientInfoSchema>;

export const createAppointmentSchema = z.object({
  tenantSlug: z.string().min(1),
  serviceId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Horário inválido"),
  clientName: cleanText(120),
  clientPhone: phoneSchema,
  clientEmail: z
    .string()
    .trim()
    .max(160)
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : undefined)),
  clientNotes: z
    .string()
    .trim()
    .max(500)
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : undefined)),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
