"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WizardProgress } from "@/components/booking/wizard-progress";
import { StepService } from "@/components/booking/step-service";
import { StepDate } from "@/components/booking/step-date";
import { StepTime } from "@/components/booking/step-time";
import { StepClientInfo } from "@/components/booking/step-client-info";
import { StepSummary } from "@/components/booking/step-summary";
import { emptyBookingSelection, type BookingSelection } from "@/types/booking";
import type { ClientInfoInput } from "@/lib/validations/booking";
import type { Service } from "@/types/database";

export function BookingWizard({
  tenantSlug,
  services,
}: {
  tenantSlug: string;
  services: Service[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selection, setSelection] = useState<BookingSelection>(emptyBookingSelection);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canContinue =
    (step === 1 && selection.service !== null) ||
    (step === 2 && selection.date !== null) ||
    (step === 3 && selection.time !== null);

  function goBack() {
    setStep((current) => Math.max(1, current - 1));
  }

  function handleClientInfoSubmit(data: ClientInfoInput) {
    setSelection((current) => ({
      ...current,
      clientName: data.clientName,
      clientPhone: data.clientPhone,
      clientEmail: data.clientEmail ?? "",
      clientNotes: data.clientNotes ?? "",
    }));
    setStep(5);
  }

  async function handleConfirm() {
    if (!selection.service || !selection.date || !selection.time) return;
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantSlug,
          serviceId: selection.service.id,
          date: selection.date,
          time: selection.time,
          clientName: selection.clientName,
          clientPhone: selection.clientPhone,
          clientEmail: selection.clientEmail,
          clientNotes: selection.clientNotes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error ?? "Não foi possível concluir o agendamento.");
        if (response.status === 409) setStep(3);
        return;
      }

      router.push(`/${tenantSlug}/agendamento/${data.appointmentId}`);
    } catch {
      toast.error("Falha de conexão. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-12">
      <WizardProgress currentStep={step} />

      {step === 1 && (
        <StepService
          services={services}
          selectedServiceId={selection.service?.id ?? null}
          onSelect={(service) => setSelection((current) => ({ ...current, service }))}
        />
      )}

      {step === 2 && (
        <StepDate
          selectedDate={selection.date}
          onSelect={(date) => setSelection((current) => ({ ...current, date }))}
        />
      )}

      {step === 3 && selection.service && selection.date && (
        <StepTime
          tenantSlug={tenantSlug}
          serviceId={selection.service.id}
          date={selection.date}
          selectedTime={selection.time}
          onSelect={(time) => setSelection((current) => ({ ...current, time }))}
        />
      )}

      {step === 4 && (
        <StepClientInfo
          defaultValues={{
            clientName: selection.clientName,
            clientPhone: selection.clientPhone,
            clientEmail: selection.clientEmail,
            clientNotes: selection.clientNotes,
          }}
          onSubmit={handleClientInfoSubmit}
        />
      )}

      {step === 5 && selection.service && selection.date && selection.time && (
        <StepSummary
          service={selection.service}
          date={selection.date}
          time={selection.time}
          clientName={selection.clientName}
          onConfirm={handleConfirm}
          isSubmitting={isSubmitting}
        />
      )}

      {step < 5 && (
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={goBack} disabled={step === 1}>
            <ChevronLeft className="h-4 w-4" />
            Voltar
          </Button>

          {step !== 4 && (
            <Button onClick={() => setStep((current) => current + 1)} disabled={!canContinue}>
              Continuar
            </Button>
          )}

          {step === 4 && (
            <Button type="submit" form="client-info-form">
              Continuar
            </Button>
          )}
        </div>
      )}

      {step === 5 && (
        <div className="flex justify-start">
          <Button variant="ghost" onClick={goBack} disabled={isSubmitting}>
            <ChevronLeft className="h-4 w-4" />
            Voltar
          </Button>
        </div>
      )}
    </div>
  );
}
