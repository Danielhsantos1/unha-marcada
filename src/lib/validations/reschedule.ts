import { z } from "zod";

export const rescheduleAppointmentSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Horário inválido"),
});

export type RescheduleAppointmentInput = z.infer<typeof rescheduleAppointmentSchema>;
