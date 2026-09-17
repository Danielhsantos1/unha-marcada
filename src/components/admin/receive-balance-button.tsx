"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RecordPaymentDialog } from "@/components/admin/record-payment-dialog";

export function ReceiveBalanceButton({
  slug,
  appointmentId,
  balanceDueCents,
}: {
  slug: string;
  appointmentId: string;
  balanceDueCents: number;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        Receber restante
      </Button>
      <RecordPaymentDialog
        slug={slug}
        appointmentId={appointmentId}
        balanceDueCents={balanceDueCents}
        open={open}
        onOpenChange={setOpen}
        onRecorded={() => router.refresh()}
      />
    </>
  );
}
