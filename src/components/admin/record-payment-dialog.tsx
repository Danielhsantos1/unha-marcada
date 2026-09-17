"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  recordPaymentFormSchema,
  type RecordPaymentFormInput,
} from "@/lib/validations/payment-transaction";
import { recordPaymentAction } from "@/app/[slug]/admin/(dashboard)/pagamentos/actions";
import { PAYMENT_METHOD_LABELS } from "@/lib/payments/financial-status";
import { formatBRL } from "@/lib/utils";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function RecordPaymentDialog({
  slug,
  appointmentId,
  balanceDueCents,
  open,
  onOpenChange,
  onRecorded,
}: {
  slug: string;
  appointmentId: string;
  balanceDueCents: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRecorded?: () => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<RecordPaymentFormInput>({
    resolver: zodResolver(recordPaymentFormSchema),
    defaultValues: {
      amount: balanceDueCents / 100,
      method: "PIX",
      date: todayISO(),
      note: "",
    },
  });

  // Reabre sempre com o saldo pendente atual pré-preenchido, não o que
  // sobrou da última vez que o modal foi usado.
  useEffect(() => {
    if (open) {
      reset({ amount: balanceDueCents / 100, method: "PIX", date: todayISO(), note: "" });
    }
  }, [open, balanceDueCents, reset]);

  async function onSubmit(data: RecordPaymentFormInput) {
    setIsSubmitting(true);
    try {
      const result = await recordPaymentAction(slug, appointmentId, data);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Pagamento registrado.");
      onOpenChange(false);
      onRecorded?.();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Receber restante</DialogTitle>
          <DialogDescription>
            Saldo pendente: <strong>{formatBRL(balanceDueCents)}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="amount">Valor recebido (R$)</Label>
            <Input id="amount" type="number" step="0.01" min="0.01" {...register("amount")} />
            {errors.amount && <p className="text-xs text-red-600">{errors.amount.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Forma de pagamento</Label>
            <Select
              value={watch("method")}
              onValueChange={(value) => setValue("method", value as RecordPaymentFormInput["method"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="date">Data</Label>
            <Input id="date" type="date" {...register("date")} />
            {errors.date && <p className="text-xs text-red-600">{errors.date.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="note">Observação (opcional)</Label>
            <Textarea id="note" {...register("note")} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Registrar pagamento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
