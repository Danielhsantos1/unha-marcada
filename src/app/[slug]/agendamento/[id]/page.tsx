import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { PaymentStatusScreen } from "@/components/booking/payment-status-screen";

export default async function AgendamentoStatusPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: appointment } = await supabase
    .from("appointments")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (!appointment) notFound();

  return <PaymentStatusScreen appointmentId={id} />;
}
