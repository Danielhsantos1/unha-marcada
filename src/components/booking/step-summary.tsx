import { User, Sparkles, CalendarDays, Clock, Wallet, AlertTriangle } from "lucide-react";
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
  const remainderCents = service.price_cents - depositCents;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      <div className="flex flex-col items-center gap-1 text-center">
        <h2 className="text-xl font-semibold text-neutral-900">Revise e confirme</h2>
        <p className="text-sm text-neutral-500">Confere se está tudo certo antes de pagar o sinal.</p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 p-5 text-sm">
          <Row icon={User} label="Cliente" value={clientName} />
          <Row icon={Sparkles} label="Serviço" value={service.name} />
          <Row icon={CalendarDays} label="Data" value={formatDateBR(date)} />
          <Row icon={Clock} label="Horário" value={time} />
          <Separator />
          <Row icon={Wallet} label="Valor total" value={formatBRL(service.price_cents)} />
          <div className="flex items-center justify-between rounded-xl bg-rose-50 px-3 py-2.5">
            <span className="text-rose-700">Sinal a pagar agora ({service.deposit_percentage}%)</span>
            <span className="font-semibold text-rose-700">{formatBRL(depositCents)}</span>
          </div>
          {remainderCents > 0 && (
            <p className="text-center text-xs text-neutral-400">
              Restante de {formatBRL(remainderCents)} a pagar no dia do atendimento.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Ao confirmar o agendamento e pagar o sinal, esse valor não é reembolsado em caso de
          cancelamento. Você pode remarcar o horário sem perder o sinal já pago.
        </p>
      </div>

      <p className="text-center text-xs text-neutral-400">
        O horário fica reservado por 15 minutos para você concluir o pagamento do
        sinal via PIX.
      </p>
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof User;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2 text-neutral-500">
        <Icon className="h-4 w-4 text-neutral-400" />
        {label}
      </span>
      <span className="font-medium text-neutral-900">{value}</span>
    </div>
  );
}
