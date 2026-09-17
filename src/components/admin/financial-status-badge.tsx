import { Badge } from "@/components/ui/badge";
import { FINANCIAL_STATUS_COLORS, FINANCIAL_STATUS_LABELS, type FinancialStatus } from "@/lib/payments/financial-status";

export function FinancialStatusBadge({ status }: { status: FinancialStatus }) {
  return <Badge className={FINANCIAL_STATUS_COLORS[status]}>{FINANCIAL_STATUS_LABELS[status]}</Badge>;
}
