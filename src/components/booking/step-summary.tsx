import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatBRL, formatDateBR } from "@/lib/utils";
import { calculateDepositCents } from "@/lib/booking/pricing";
import type { Service } from "@/types/database";

export function StepSummary({
  service,
  date,
  time,
  clientName,
}: {
  service: Service;
  date: string;
  time: string;
  clientName: string;
}) {
  const depositCents = calculateDepositCents(service);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <h2 className="text-center text-xl font-semibold text-neutral-900">
        Resumo do agendamento
      </h2>

      <Card>
        <CardContent className="flex flex-col gap-3 p-5 text-sm">
          <Row label="Cliente" value={clientName} />
          <Row label="Serviço" value={service.name} />
          <Row label="Data" value={formatDateBR(date)} />
          <Row label="Horário" value={time} />
          <Separator />
          <Row label="Valor total" value={formatBRL(service.price_cents)} />
          <Row
            label={`Sinal a pagar agora (${service.deposit_percentage}%)`}
            value={formatBRL(depositCents)}
            highlight
          />
        </CardContent>
      </Card>

      <p className="text-center text-xs text-neutral-400">
        O horário fica reservado por 15 minutos para você concluir o pagamento do
        sinal via PIX.
      </p>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-neutral-500">{label}</span>
      <span className={highlight ? "font-semibold text-rose-600" : "font-medium text-neutral-900"}>
        {value}
      </span>
    </div>
  );
}
