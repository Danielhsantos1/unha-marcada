"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  manualAppointmentFormSchema,
  type ManualAppointmentFormInput,
} from "@/lib/validations/manual-appointment";
import { createManualAppointmentAction } from "@/app/[slug]/admin/(dashboard)/agenda/actions";
import { formatBRL } from "@/lib/utils";
import type { Service } from "@/types/database";

export function NewAppointmentDialog({ slug, services }: { slug: string; services: Service[] }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [slots, setSlots] = useState<string[] | null>(null);
  const [slotsError, setSlotsError] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ManualAppointmentFormInput>({
    resolver: zodResolver(manualAppointmentFormSchema),
    defaultValues: { serviceId: "", date: "", time: "", clientName: "", clientPhone: "" },
  });

  const serviceId = watch("serviceId");
  const date = watch("date");

  useEffect(() => {
    if (!serviceId || !date) {
      setSlots(null);
      return;
    }
    let cancelled = false;
    setSlots(null);
    setSlotsError(false);
    fetch(`/api/tenants/${slug}/slots?serviceId=${serviceId}&date=${date}`)
      .then((res) => {
        if (!res.ok) throw new Error("failed");
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setSlots(data.slots ?? []);
      })
      .catch(() => {
        if (!cancelled) setSlotsError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [slug, serviceId, date]);

  function onSubmit(data: ManualAppointmentFormInput) {
    startTransition(async () => {
      const result = await createManualAppointmentAction(slug, data);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Agendamento criado.");
      reset();
      setOpen(false);
    });
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button size="lg" className="h-12 gap-1.5 bg-rose-700 hover:bg-rose-800">
          <Plus className="h-4 w-4" />
          Novo agendamento
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo agendamento</DialogTitle>
          <DialogDescription>
            Pra cliente que ligou ou chegou sem marcar. Entra confirmado direto, sem cobrar sinal —
            combine o pagamento com a cliente por fora.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="clientName">Nome da cliente</Label>
            <Input id="clientName" {...register("clientName")} />
            {errors.clientName && <p className="text-xs text-red-600">{errors.clientName.message}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="clientPhone">WhatsApp</Label>
            <Input id="clientPhone" placeholder="(00) 00000-0000" {...register("clientPhone")} />
            {errors.clientPhone && <p className="text-xs text-red-600">{errors.clientPhone.message}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="serviceId">Serviço</Label>
            <Controller
              control={control}
              name="serviceId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="serviceId">
                    <SelectValue placeholder="Escolha o serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name} · {service.duration_minutes} min · {formatBRL(service.price_cents)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.serviceId && <p className="text-xs text-red-600">{errors.serviceId.message}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="date">Data</Label>
            <Input id="date" type="date" min={today} {...register("date")} />
            {errors.date && <p className="text-xs text-red-600">{errors.date.message}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="time">Horário</Label>
            <Controller
              control={control}
              name="time"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={!serviceId || !date}>
                  <SelectTrigger id="time">
                    <SelectValue
                      placeholder={
                        !serviceId || !date
                          ? "Escolha o serviço e a data primeiro"
                          : slots === null
                            ? "Carregando..."
                            : "Escolha o horário"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {(slots ?? []).map((slot) => (
                      <SelectItem key={slot} value={slot}>
                        {slot}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {slotsError && (
              <p className="text-xs text-red-600">Não foi possível carregar os horários.</p>
            )}
            {slots !== null && slots.length === 0 && !slotsError && (
              <p className="text-xs text-neutral-500">Nenhum horário livre nesse dia.</p>
            )}
            {errors.time && <p className="text-xs text-red-600">{errors.time.message}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="clientNotes">Observações (opcional)</Label>
            <Textarea id="clientNotes" rows={2} {...register("clientNotes")} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || isPending}>
              {(isSubmitting || isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
              Criar agendamento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
