"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { CheckCircle2, Clock, XCircle, Copy, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { CountdownTimer } from "@/components/booking/countdown-timer";
import { PixPanel } from "@/components/booking/pix-panel";
import { StepDate } from "@/components/booking/step-date";
import { StepTime } from "@/components/booking/step-time";
import { formatBRL, formatDateBR, formatTimeBR } from "@/lib/utils";
import { SELF_SERVICE_CUTOFF_HOURS } from "@/lib/constants";
import type { AppointmentStatus } from "@/types/database";

const POLL_INTERVAL_MS = 4000;

interface StatusResponse {
  appointment: {
    id: string;
    status: AppointmentStatus;
    appointment_date: string;
    start_time: string;
    deposit_amount_cents: number;
    hold_expires_at: string;
    client_name: string;
    service: { id: string; name: string } | null;
    tenant: { slug: string; name: string } | null;
  };
  payment: {
    status: string;
    qr_code_base64: string | null;
    pix_copy_paste: string | null;
    expires_at: string;
  } | null;
}

/** Same rule the server enforces on cancel/reschedule — used here only to show/hide the buttons. */
function hoursUntil(dateISO: string, time: string): number {
  const target = new Date(`${dateISO}T${time}-03:00`);
  return (target.getTime() - Date.now()) / 3_600_000;
}

export function PaymentStatusScreen({ appointmentId }: { appointmentId: string }) {
  const [data, setData] = useState<StatusResponse | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleStep, setRescheduleStep] = useState<1 | 2 | "done">(1);
  const [rescheduleDate, setRescheduleDate] = useState<string | null>(null);
  const [rescheduleTime, setRescheduleTime] = useState<string | null>(null);
  const [isRescheduling, setIsRescheduling] = useState(false);
  // null = ainda não carregou; StepDate trata null/undefined como "não
  // desabilita nada" pra não piscar todos os dias fechados durante o fetch.
  const [openWeekdays, setOpenWeekdays] = useState<number[] | null>(null);

  const tenantSlugForAvailability = data?.appointment.tenant?.slug;

  useEffect(() => {
    if (!tenantSlugForAvailability) return;
    fetch(`/api/tenants/${tenantSlugForAvailability}/availability`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json) setOpenWeekdays(json.openWeekdays ?? []);
      })
      .catch(() => {});
  }, [tenantSlugForAvailability]);

  const refresh = useCallback(async () => {
    const response = await fetch(`/api/appointments/${appointmentId}/status`, {
      cache: "no-store",
    });
    if (response.ok) setData(await response.json());
  }, [appointmentId]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copiado.");
    } catch {
      toast.error("Não foi possível copiar o link.");
    }
  }

  async function handleCancelConfirm() {
    setIsCancelling(true);
    try {
      const response = await fetch(`/api/appointments/${appointmentId}/cancel`, {
        method: "POST",
      });
      const result = await response.json().catch(() => ({}) as { error?: string });
      if (!response.ok) {
        toast.error(result.error ?? "Não foi possível cancelar.");
        return;
      }
      toast.success("Agendamento cancelado.");
      setCancelOpen(false);
      refresh();
    } catch {
      toast.error("Algo deu errado. Verifique sua internet e tente novamente.");
    } finally {
      setIsCancelling(false);
    }
  }

  function openReschedule() {
    setRescheduleStep(1);
    setRescheduleDate(null);
    setRescheduleTime(null);
    setRescheduleOpen(true);
  }

  async function handleRescheduleConfirm() {
    if (!rescheduleDate || !rescheduleTime) return;
    setIsRescheduling(true);
    try {
      const response = await fetch(`/api/appointments/${appointmentId}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: rescheduleDate, time: rescheduleTime }),
      });
      const result = await response.json().catch(() => ({}) as { error?: string });
      if (!response.ok) {
        toast.error(result.error ?? "Não foi possível remarcar. Tente novamente.");
        return;
      }
      // Stays open showing a confirmation the client has to dismiss on
      // purpose — a toast alone is easy to miss, especially on mobile,
      // and "did it actually save?" is exactly the confusion this avoids.
      setRescheduleStep("done");
      refresh();
    } catch {
      toast.error("Algo deu errado. Verifique sua internet e tente novamente.");
    } finally {
      setIsRescheduling(false);
    }
  }

  if (!data) {
    return <p className="py-20 text-center text-neutral-400">Carregando...</p>;
  }

  const { appointment, payment } = data;
  const tenantSlug = appointment.tenant?.slug ?? "";
  const canSelfServe =
    appointment.status === "CONFIRMED" &&
    hoursUntil(appointment.appointment_date, appointment.start_time) >= SELF_SERVICE_CUTOFF_HOURS;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-6 px-6 py-12">
      {appointment.status === "PENDING_PAYMENT" && payment?.qr_code_base64 && payment.pix_copy_paste && (
        <>
          <div className="flex flex-col items-center gap-1 text-center">
            <Clock className="h-6 w-6 text-amber-500" />
            <h1 className="text-xl font-semibold text-neutral-900">Pague o sinal via PIX</h1>
            <p className="text-sm text-neutral-500">
              Horário reservado por mais{" "}
              <CountdownTimer expiresAt={appointment.hold_expires_at} onExpire={refresh} />
            </p>
          </div>

          <PixPanel qrCodeBase64={payment.qr_code_base64} pixCopyPaste={payment.pix_copy_paste} />

          <Card className="w-full">
            <CardContent className="flex flex-col gap-2 p-4 text-sm">
              <SummaryRow label="Serviço" value={appointment.service?.name ?? "-"} />
              <SummaryRow
                label="Data"
                value={`${formatDateBR(appointment.appointment_date)} às ${formatTimeBR(appointment.start_time)}`}
              />
              <SummaryRow label="Sinal" value={formatBRL(appointment.deposit_amount_cents)} highlight />
            </CardContent>
          </Card>

          <p className="text-center text-xs text-neutral-400">
            Assim que o pagamento for identificado, esta página é atualizada
            automaticamente.
          </p>
        </>
      )}

      {appointment.status === "CONFIRMED" && (
        <>
          <div className="flex flex-col items-center gap-3 text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-500" />
            <h1 className="text-xl font-semibold text-neutral-900">Agendamento confirmado!</h1>
            <p className="text-neutral-500">
              {appointment.client_name}, seu horário de {appointment.service?.name} está garantido
              para {formatDateBR(appointment.appointment_date)} às{" "}
              {formatTimeBR(appointment.start_time)}.
            </p>
          </div>

          <Card className="w-full">
            <CardContent className="flex flex-col gap-2 p-4">
              <p className="text-xs text-neutral-500">
                Esse é o link do seu comprovante — salva ele (ou favorita a página) pra acessar,
                remarcar ou cancelar seu horário depois.
              </p>
              <Button variant="outline" size="sm" onClick={handleCopyLink} className="w-fit gap-1.5">
                <Copy className="h-3.5 w-3.5" />
                Copiar link
              </Button>
            </CardContent>
          </Card>

          {canSelfServe ? (
            <div className="flex w-full gap-2">
              <Button variant="outline" className="flex-1" onClick={openReschedule}>
                Remarcar
              </Button>
              <Button
                variant="outline"
                className="flex-1 text-red-600 hover:text-red-700"
                onClick={() => setCancelOpen(true)}
              >
                Cancelar
              </Button>
            </div>
          ) : (
            <p className="text-center text-xs text-neutral-400">
              Faltam menos de {SELF_SERVICE_CUTOFF_HOURS}h para o horário — pra cancelar ou
              remarcar agora, fale direto com {appointment.tenant?.name ?? "o salão"}.
            </p>
          )}

          <Button asChild variant="ghost">
            <Link href={`/${tenantSlug}`}>Voltar para o início</Link>
          </Button>
        </>
      )}

      {(appointment.status === "EXPIRED" || appointment.status === "CANCELLED") && (
        <div className="flex flex-col items-center gap-3 text-center">
          <XCircle className="h-12 w-12 text-red-500" />
          <h1 className="text-xl font-semibold text-neutral-900">
            {appointment.status === "EXPIRED" ? "Tempo esgotado" : "Agendamento cancelado"}
          </h1>
          <p className="text-neutral-500">
            {appointment.status === "EXPIRED"
              ? "O prazo de 15 minutos para pagamento do sinal terminou e o horário foi liberado."
              : "Não foi possível confirmar o pagamento do sinal."}
          </p>
          <Button asChild>
            <Link href={`/${tenantSlug}/agendar`}>Agendar novamente</Link>
          </Button>
        </div>
      )}

      {appointment.status === "COMPLETED" && (
        <div className="flex flex-col items-center gap-3 text-center">
          <CheckCircle2 className="h-12 w-12 text-blue-500" />
          <h1 className="text-xl font-semibold text-neutral-900">Atendimento concluído</h1>
          <p className="text-neutral-500">Esperamos que tenha gostado! Até a próxima.</p>
        </div>
      )}

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar agendamento</DialogTitle>
            <DialogDescription>
              O horário será liberado. Essa ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)} disabled={isCancelling}>
              Voltar
            </Button>
            <Button variant="destructive" onClick={handleCancelConfirm} disabled={isCancelling}>
              {isCancelling && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirmar cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogContent>
          {rescheduleStep === "done" ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  Remarcado!
                </DialogTitle>
                <DialogDescription>
                  Seu novo horário é{" "}
                  {rescheduleDate && formatDateBR(rescheduleDate)} às {rescheduleTime}.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button onClick={() => setRescheduleOpen(false)}>Fechar</Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Remarcar agendamento</DialogTitle>
                <DialogDescription>
                  {rescheduleStep === 1 ? "Escolha o novo dia." : "Escolha o novo horário."}
                </DialogDescription>
              </DialogHeader>

              {rescheduleStep === 1 && (
                <StepDate
                  selectedDate={rescheduleDate}
                  onSelect={setRescheduleDate}
                  openWeekdays={openWeekdays ?? undefined}
                />
              )}

              {rescheduleStep === 2 && appointment.service && rescheduleDate && (
                <StepTime
                  tenantSlug={tenantSlug}
                  serviceId={appointment.service.id}
                  date={rescheduleDate}
                  selectedTime={rescheduleTime}
                  onSelect={setRescheduleTime}
                  excludeAppointmentId={appointment.id}
                />
              )}

              <DialogFooter>
                {rescheduleStep === 2 && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setRescheduleStep(1);
                      setRescheduleTime(null);
                    }}
                    disabled={isRescheduling}
                  >
                    Voltar
                  </Button>
                )}
                {rescheduleStep === 1 && (
                  <Button disabled={!rescheduleDate} onClick={() => setRescheduleStep(2)}>
                    Continuar
                  </Button>
                )}
                {rescheduleStep === 2 && (
                  <Button disabled={!rescheduleTime || isRescheduling} onClick={handleRescheduleConfirm}>
                    {isRescheduling && <Loader2 className="h-4 w-4 animate-spin" />}
                    Confirmar remarcação
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SummaryRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-neutral-500">{label}</span>
      <span className={highlight ? "font-semibold text-rose-600" : "font-medium text-neutral-900"}>
        {value}
      </span>
    </div>
  );
}
