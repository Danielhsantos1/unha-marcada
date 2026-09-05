"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CountdownTimer } from "@/components/booking/countdown-timer";
import { PixPanel } from "@/components/booking/pix-panel";
import { formatBRL, formatDateBR, formatTimeBR } from "@/lib/utils";
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
    service: { name: string } | null;
    tenant: { slug: string; name: string } | null;
  };
  payment: {
    status: string;
    qr_code_base64: string | null;
    pix_copy_paste: string | null;
    expires_at: string;
  } | null;
}

export function PaymentStatusScreen({ appointmentId }: { appointmentId: string }) {
  const [data, setData] = useState<StatusResponse | null>(null);

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

  if (!data) {
    return <p className="py-20 text-center text-neutral-400">Carregando...</p>;
  }

  const { appointment, payment } = data;
  const tenantSlug = appointment.tenant?.slug ?? "";

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
        <div className="flex flex-col items-center gap-3 text-center">
          <CheckCircle2 className="h-12 w-12 text-emerald-500" />
          <h1 className="text-xl font-semibold text-neutral-900">Agendamento confirmado!</h1>
          <p className="text-neutral-500">
            {appointment.client_name}, seu horário de {appointment.service?.name} está garantido
            para {formatDateBR(appointment.appointment_date)} às{" "}
            {formatTimeBR(appointment.start_time)}.
          </p>
          <Button asChild variant="outline">
            <Link href={`/${tenantSlug}`}>Voltar para o início</Link>
          </Button>
        </div>
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
