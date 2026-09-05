"use client";

import { useTransition } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { markAppointmentCompletedAction } from "@/app/[slug]/admin/(dashboard)/agenda/actions";

export function CompleteAppointmentButton({
  slug,
  appointmentId,
}: {
  slug: string;
  appointmentId: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await markAppointmentCompletedAction(slug, appointmentId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Agendamento concluído.");
    });
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7 text-neutral-400 hover:text-blue-600"
      onClick={handleClick}
      disabled={isPending}
    >
      <Check className="h-4 w-4" />
    </Button>
  );
}
