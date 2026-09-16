import { z } from "zod";

export const blockedDateFormSchema = z
  .object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
    startTime: z.string().regex(/^\d{2}:\d{2}$/, "Hora inválida"),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
    endTime: z.string().regex(/^\d{2}:\d{2}$/, "Hora inválida"),
    reason: z.string().trim().max(200).optional().or(z.literal("")),
  })
  .refine(
    (data) => `${data.endDate}T${data.endTime}` > `${data.startDate}T${data.startTime}`,
    { message: "O fim deve ser depois do início.", path: ["endTime"] },
  );

export type BlockedDateFormInput = z.infer<typeof blockedDateFormSchema>;
