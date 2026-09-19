// Hand-written types mirroring supabase/migrations/0001_init.sql.
// If you change the schema, update this file (or generate it automatically
// with `supabase gen types typescript`, see README).

export type TenantRole = "owner" | "admin" | "staff";

export type ServiceCategory = "maos" | "pes" | "combo";

export type AppointmentStatus =
  | "PENDING_PAYMENT"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "EXPIRED";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  phone: string | null;
  logo_url: string | null;
  primary_color: string;
  buffer_minutes: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  tenant_id: string;
  role: TenantRole;
  full_name: string;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  tenant_id: string;
  category: ServiceCategory;
  name: string;
  description: string | null;
  price_cents: number;
  duration_minutes: number;
  deposit_percentage: number;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Availability {
  id: string;
  tenant_id: string;
  day_of_week: number; // 0 = Sunday .. 6 = Saturday
  start_time: string; // "HH:MM:SS"
  end_time: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BlockedDate {
  id: string;
  tenant_id: string;
  starts_at: string;
  ends_at: string;
  reason: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Appointment {
  id: string;
  tenant_id: string;
  service_id: string;
  client_name: string;
  client_phone: string;
  client_email: string | null;
  client_notes: string | null;
  appointment_date: string; // "YYYY-MM-DD"
  start_time: string; // "HH:MM:SS"
  end_time: string;
  status: AppointmentStatus;
  total_price_cents: number;
  deposit_amount_cents: number;
  hold_expires_at: string;
  cancelled_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  tenant_id: string;
  appointment_id: string;
  provider: string;
  provider_payment_id: string | null;
  status: PaymentStatus;
  amount_cents: number;
  qr_code: string | null;
  qr_code_base64: string | null;
  pix_copy_paste: string | null;
  raw_payload: Record<string, unknown> | null;
  paid_at: string | null;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface TenantPaymentCredentials {
  tenant_id: string;
  mercadopago_access_token: string;
  mercadopago_webhook_secret: string;
  created_at: string;
  updated_at: string;
}

export type PaymentMethod = "PIX" | "DINHEIRO" | "CARTAO_DEBITO" | "CARTAO_CREDITO" | "OUTRO";

export type FinancialTransactionType = "SINAL" | "PAGAMENTO_FINAL" | "ESTORNO";

/**
 * One row per real money movement — the PIX sinal, a final payment
 * collected in person, or a controlled refund. Append-only: see
 * supabase/migrations/0003_payment_transactions.sql.
 */
export interface PaymentTransaction {
  id: string;
  receipt_number: number;
  tenant_id: string;
  appointment_id: string;
  type: FinancialTransactionType;
  amount_cents: number;
  method: PaymentMethod;
  note: string | null;
  recorded_by: string | null;
  recorded_at: string;
  created_at: string;
}

/** Read-only view: derived totals for one appointment, never stored/duplicated. */
export interface AppointmentPaymentSummary {
  appointment_id: string;
  tenant_id: string;
  total_price_cents: number;
  appointment_status: AppointmentStatus;
  amount_received_cents: number;
  balance_due_cents: number;
  last_payment_at: string | null;
  last_receipt_number: number | null;
}

export interface AppointmentWithRelations extends Appointment {
  service: Service;
  tenant: Tenant;
  payment: Payment | null;
}
