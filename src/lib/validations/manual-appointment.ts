import type { z } from "zod";
import { createAppointmentSchema } from "@/lib/validations/booking";

// Mesmo formato do agendamento público, só sem tenantSlug — o servidor já
// sabe o tenant pelo slug da rota admin autenticada.
export const manualAppointmentFormSchema = createAppointmentSchema.omit({ tenantSlug: true });

export type ManualAppointmentFormInput = z.infer<typeof manualAppointmentFormSchema>;
