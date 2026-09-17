"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { RecordPaymentDialog } from "@/components/admin/record-payment-dialog";
import {
  markAppointmentCompletedAction,
  forceCompleteAppointmentAction,
} from "@/app/[slug]/admin/(dashboard)/agenda/actions";
import { formatBRL } from "@/lib/utils";

export function CompleteAppointmentButton({
  slug,
  appointmentId,
}: {
  slug: string;
  appointmentId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [warningOpen, setWarningOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [pendingBalanceCents, setPendingBalanceCents] = useState(0);

  function handleClick() {
    startTransition(async () => {
      const result = await markAppointmentCompletedAction(slug, appointmentId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.pendingBalanceCents && result.pendingBalanceCents > 0) {
        setPendingBalanceCents(result.pendingBalanceCents);
        setWarningOpen(true);
        return;
      }
      toast.success("Atendimento concluído.");
    });
  }

  function handleRemindLater() {
    setWarningOpen(false);
    startTransition(async () => {
      const result = await forceCompleteAppointmentAction(slug, appointmentId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Atendimento concluído com saldo pendente.");
    });
  }

  function handleReceiveNow() {
    setWarningOpen(false);
    setPaymentOpen(true);
  }

  function handlePaymentRecorded() {
    startTransition(async () => {
      const result = await forceCompleteAppointmentAction(slug, appointmentId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Pagamento recebido e atendimento concluído.");
    });
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10 text-neutral-400 hover:text-blue-600"
        onClick={handleClick}
        disabled={isPending}
      >
        <Check className="h-4 w-4" />
      </Button>

      <Dialog open={warningOpen} onOpenChange={setWarningOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>⚠️ Existe saldo pendente</DialogTitle>
            <DialogDescription>
              Existe saldo pendente de <strong>{formatBRL(pendingBalanceCents)}</strong> para este
              atendimento. Deseja registrar o pagamento agora?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleRemindLater} disabled={isPending}>
              Lembrar depois
            </Button>
            <Button onClick={handleReceiveNow} disabled={isPending}>
              Receber agora
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RecordPaymentDialog
        slug={slug}
        appointmentId={appointmentId}
        balanceDueCents={pendingBalanceCents}
        open={paymentOpen}
        onOpenChange={setPaymentOpen}
        onRecorded={handlePaymentRecorded}
      />
    </>
  );
}
