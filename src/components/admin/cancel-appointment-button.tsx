"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cancelAppointmentAction } from "@/app/[slug]/admin/(dashboard)/agenda/actions";

export function CancelAppointmentButton({
  slug,
  appointmentId,
}: {
  slug: string;
  appointmentId: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      const result = await cancelAppointmentAction(slug, appointmentId, reason);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Agendamento cancelado.");
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-neutral-400 hover:text-red-600">
          <X className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancelar agendamento</DialogTitle>
          <DialogDescription>
            O horário será liberado imediatamente. Essa ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          placeholder="Motivo (opcional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Voltar
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={isPending}>
            Confirmar cancelamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
