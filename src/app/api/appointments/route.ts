import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createAppointmentSchema } from "@/lib/validations/booking";
import { calculateDepositCents } from "@/lib/booking/pricing";
import { getAvailableSlots, timeStringToMinutes, minutesToTimeString } from "@/lib/booking/availability";
import { createPixPayment } from "@/lib/mercadopago";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { HOLD_DURATION_MINUTES } from "@/lib/constants";
import type { Service, Tenant, TenantPaymentCredentials } from "@/types/database";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`create-appointment:${ip}`, {
    limit: 8,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Muitas tentativas. Tente novamente em instantes." },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = createAppointmentSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const input = parsed.data;
  const supabase = createAdminClient();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("*")
    .eq("slug", input.tenantSlug)
    .eq("is_active", true)
    .maybeSingle<Tenant>();

  if (!tenant) {
    return NextResponse.json({ error: "Salão não encontrado." }, { status: 404 });
  }

  const { data: credentials } = await supabase
    .from("tenant_payment_credentials")
    .select("mercadopago_access_token")
    .eq("tenant_id", tenant.id)
    .maybeSingle<Pick<TenantPaymentCredentials, "mercadopago_access_token">>();

  if (!credentials) {
    return NextResponse.json(
      { error: "Este salão ainda não configurou o recebimento de pagamentos." },
      { status: 503 },
    );
  }

  const { data: service } = await supabase
    .from("services")
    .select("*")
    .eq("id", input.serviceId)
    .eq("tenant_id", tenant.id)
    .eq("is_active", true)
    .maybeSingle<Service>();

  if (!service) {
    return NextResponse.json({ error: "Serviço não encontrado." }, { status: 404 });
  }

  // Never trust the client for scheduling logic — recompute the actual
  // available slots server-side and reject anything outside that list.
  const availableSlots = await getAvailableSlots(
    tenant.id,
    input.date,
    service.duration_minutes,
    undefined,
    tenant.buffer_minutes,
  );
  if (!availableSlots.includes(input.time)) {
    return NextResponse.json(
      { error: "Este horário não está mais disponível. Escolha outro." },
      { status: 409 },
    );
  }

  const startMinutes = timeStringToMinutes(input.time);
  const endTime = `${minutesToTimeString(startMinutes + service.duration_minutes)}:00`;
  const startTime = `${input.time}:00`;

  const totalPriceCents = service.price_cents;
  const depositAmountCents = calculateDepositCents(service);
  const holdExpiresAt = new Date(Date.now() + HOLD_DURATION_MINUTES * 60_000).toISOString();

  const { data: appointment, error: insertError } = await supabase
    .from("appointments")
    .insert({
      tenant_id: tenant.id,
      service_id: service.id,
      client_name: input.clientName,
      client_phone: input.clientPhone,
      client_email: input.clientEmail ?? null,
      client_notes: input.clientNotes ?? null,
      appointment_date: input.date,
      start_time: startTime,
      end_time: endTime,
      status: "PENDING_PAYMENT",
      total_price_cents: totalPriceCents,
      deposit_amount_cents: depositAmountCents,
      hold_expires_at: holdExpiresAt,
    })
    .select("id")
    .single();

  if (insertError) {
    // 23505 = unique_violation: someone else grabbed this exact slot first.
    if (insertError.code === "23505") {
      return NextResponse.json(
        { error: "Este horário acabou de ser reservado por outra pessoa. Escolha outro." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: "Não foi possível criar o agendamento." }, { status: 500 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) {
    await supabase.from("appointments").delete().eq("id", appointment.id);
    return NextResponse.json(
      { error: "NEXT_PUBLIC_SITE_URL não configurada no servidor." },
      { status: 500 },
    );
  }

  try {
    const pix = await createPixPayment({
      amountCents: depositAmountCents,
      description: `Sinal - ${service.name} - ${tenant.name}`,
      payerEmail: input.clientEmail,
      payerFirstName: input.clientName.split(" ")[0],
      payerPhone: input.clientPhone,
      externalReference: appointment.id,
      notificationUrl: `${siteUrl}/api/webhooks/mercadopago`,
    }, credentials.mercadopago_access_token);

    const { error: paymentError } = await supabase.from("payments").insert({
      tenant_id: tenant.id,
      appointment_id: appointment.id,
      provider: "mercadopago",
      provider_payment_id: pix.providerPaymentId,
      status: "PENDING",
      amount_cents: depositAmountCents,
      qr_code: pix.qrCode,
      qr_code_base64: pix.qrCodeBase64,
      pix_copy_paste: pix.qrCode,
      expires_at: holdExpiresAt,
    });

    if (paymentError) throw paymentError;
  } catch {
    // Roll back the hold immediately instead of making the client wait
    // 15 minutes for a slot that never got a valid PIX charge.
    await supabase.from("appointments").delete().eq("id", appointment.id);
    return NextResponse.json(
      { error: "Não foi possível gerar o PIX. Tente novamente." },
      { status: 502 },
    );
  }

  return NextResponse.json({ appointmentId: appointment.id, tenantSlug: tenant.slug }, { status: 201 });
}
