import { z } from "zod";

export const schedulingSettingsFormSchema = z.object({
  bufferMinutes: z.coerce
    .number()
    .int("Use um número inteiro de minutos.")
    .min(0, "Não pode ser negativo.")
    .max(120, "Máximo de 120 minutos."),
});

export type SchedulingSettingsFormInput = z.infer<typeof schedulingSettingsFormSchema>;
