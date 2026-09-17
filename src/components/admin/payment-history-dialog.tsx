"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { History, Loader2, Undo2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  getAppointmentTransactionsAction,
  refundTransactionAction,
  type TransactionWithAuthor,
} from "@/app/[slug]/admin/(dashboard)/pagamentos/actions";
import { PAYMENT_METHOD_LABELS, TRANSACTION_TYPE_LABELS } from "@/lib/payments/financial-status";
import { formatBRL, formatDateBR, formatSaoPauloDateTime } from "@/lib/utils";
import type { AppointmentPaymentSummary } from "@/types/database";

export function PaymentHistoryDialog({ slug, appointmentId }: { slug: string; appointmentId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<TransactionWithAuthor[]>([]);
  const [summary, setSummary] = useState<AppointmentPaymentSummary | null>(null);
  const [refundTarget, setRefundTarget] = useState<TransactionWithAuthor | null>(null);

  async function load() {
    setLoading(true);
    try {
      const result = await getAppointmentTransactionsAction(slug, appointmentId);
      setTransactions(result.transactions);
      setSummary(result.summary);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) load();
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const isQuitado = summary ? summary.balance_due_cents <= 0 && summary.amount_received_cents > 0 : false;

  return (
    <>
      <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
        <History className="h-3.5 w-3.5" />
        Histórico
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Histórico financeiro</DialogTitle>
            <DialogDescription>Todos os lançamentos deste atendimento, do mais antigo ao mais recente.</DialogDescription>
          </DialogHeader>

          {loading && (
            <div className="flex items-center justify-center py-8 text-neutral-400">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          )}

          {!loading && summary && (
            <>
              {isQuitado && (
                <div className="flex flex-col items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center">
                  <p className="flex items-center gap-1.5 font-semibold text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                    QUITADO
                  </p>
                  {summary.last_payment_at && (
                    <p className="text-xs text-emerald-700">
                      Quitado em {formatDateBR(formatSaoPauloDateTime(summary.last_payment_at).date)} às{" "}
                      {formatSaoPauloDateTime(summary.last_payment_at).time}
                    </p>
                  )}
                  {summary.last_receipt_number && (
                    <p className="text-xs text-emerald-600">Comprovante nº {summary.last_receipt_number}</p>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-2">
                {transactions.length === 0 && (
                  <p className="py-4 text-center text-sm text-neutral-400">Nenhum lançamento ainda.</p>
                )}
                {transactions.map((t) => {
                  const local = formatSaoPauloDateTime(t.recorded_at);
                  const isNegative = t.amount_cents < 0;
                  return (
                    <div
                      key={t.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-neutral-900">
                          {TRANSACTION_TYPE_LABELS[t.type]}
                          <span className="ml-2 text-xs font-normal text-neutral-400">
                            {PAYMENT_METHOD_LABELS[t.method]}
                          </span>
                        </p>
                        <p className="text-xs text-neutral-400">
                          {formatDateBR(local.date)} às {local.time}
                          {t.recorded_by_name ? ` · ${t.recorded_by_name}` : " · automático"}
                        </p>
                        {t.note && <p className="mt-0.5 truncate text-xs text-neutral-500">{t.note}</p>}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className={isNegative ? "font-semibold text-red-600" : "font-semibold text-emerald-600"}>
                          {isNegative ? "-" : "+"}
                          {formatBRL(Math.abs(t.amount_cents))}
                        </span>
                        <Link
                          href={`/${slug}/admin/pagamentos/${appointmentId}/comprovante/${t.id}`}
                          target="_blank"
                          className="text-xs text-rose-600 hover:underline"
                        >
                          Nº {t.receipt_number}
                        </Link>
                        {t.type !== "ESTORNO" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-neutral-400 hover:text-red-600"
                            onClick={() => setRefundTarget(t)}
                          >
                            <Undo2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between border-t border-neutral-100 pt-3 text-sm font-semibold text-neutral-900">
                <span>Total recebido</span>
                <span>{formatBRL(summary.amount_received_cents)}</span>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {refundTarget && (
        <RefundDialog
          slug={slug}
          transaction={refundTarget}
          onClose={() => setRefundTarget(null)}
          onDone={() => {
            setRefundTarget(null);
            load();
          }}
        />
      )}
    </>
  );
}

function RefundDialog({
  slug,
  transaction,
  onClose,
  onDone,
}: {
  slug: string;
  transaction: TransactionWithAuthor;
  onClose: () => void;
  onDone: () => void;
}) {
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      const result = await refundTransactionAction(slug, transaction.id, { reason });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Estorno registrado.");
      onDone();
    });
  }

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Estornar {formatBRL(transaction.amount_cents)}</DialogTitle>
          <DialogDescription>
            Isso não apaga o lançamento original — cria um novo registro de estorno no histórico.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="refund-reason">Motivo</Label>
          <Textarea id="refund-reason" value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Voltar
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={isPending || !reason.trim()}>
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirmar estorno
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
