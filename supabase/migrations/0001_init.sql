-- ============================================================================
-- Manicure & Pedicure Booking Platform — Initial Schema
-- ============================================================================
-- Multi-tenant: every salon ("tenant") gets its own row in `tenants`, and
-- every other table carries a `tenant_id` so one salon can never see or
-- touch another salon's data. Row Level Security (RLS) enforces this at the
-- database level, not just in application code.
--
-- Security model (read this before touching RLS policies):
--   - `tenants` and `services` are safe to expose publicly (read-only, no
--     personal data), so anonymous visitors can read them directly through
--     the Supabase client to render the public booking pages.
--   - `availability`, `blocked_dates`, `appointments` and `payments` involve
--     scheduling logic and personal/financial data. They have NO public
--     policies at all. All guest-facing reads/writes for these go through
--     Next.js Route Handlers / Server Actions using the Supabase
--     `service_role` key, which lives only on the server and bypasses RLS
--     by design. This gives us full control over exactly what a guest can
--     see or change (e.g. "check my appointment status") without ever
--     widening a table-level policy.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- ENUM types
-- ----------------------------------------------------------------------------

create type tenant_role as enum ('owner', 'admin', 'staff');

create type service_category as enum ('maos', 'pes', 'combo');

create type appointment_status as enum (
  'PENDING_PAYMENT',
  'CONFIRMED',
  'COMPLETED',
  'CANCELLED',
  'EXPIRED'
);

create type payment_status as enum (
  'PENDING',
  'PAID',
  'FAILED',
  'REFUNDED'
);

-- ----------------------------------------------------------------------------
-- updated_at helper trigger
-- ----------------------------------------------------------------------------

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- tenants — one row per salon/professional using the platform
-- ----------------------------------------------------------------------------

create table tenants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  phone text,
  logo_url text,
  primary_color text not null default '#D9A5B3',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_tenants_slug on tenants (slug);

create trigger trg_tenants_updated_at
  before update on tenants
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- profiles — staff/admin accounts, one-to-one with Supabase auth.users
-- ----------------------------------------------------------------------------
-- We deliberately do NOT create our own "users" table that duplicates
-- auth.users (a common beginner mistake). Supabase already manages
-- authentication in auth.users; `profiles` only stores the extra
-- application-specific fields (which tenant, which role, display name).

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  tenant_id uuid not null references tenants (id) on delete cascade,
  role tenant_role not null default 'staff',
  full_name text not null,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_profiles_tenant_id on profiles (tenant_id);

create trigger trg_profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- services — the catalog of services a tenant offers
-- ----------------------------------------------------------------------------

create table services (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  category service_category not null,
  name text not null,
  description text,
  price_cents integer not null check (price_cents > 0),
  duration_minutes integer not null check (duration_minutes > 0),
  deposit_percentage numeric(5, 2) not null default 50.00
    check (deposit_percentage > 0 and deposit_percentage <= 100),
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_services_tenant_id on services (tenant_id);
create index idx_services_tenant_active on services (tenant_id, is_active);

create trigger trg_services_updated_at
  before update on services
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- availability — recurring weekly working hours per tenant
-- ----------------------------------------------------------------------------

create table availability (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6), -- 0 = Sunday
  start_time time not null,
  end_time time not null check (end_time > start_time),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_availability_tenant_day on availability (tenant_id, day_of_week);

create trigger trg_availability_updated_at
  before update on availability
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- blocked_dates — one-off blocks (holidays, vacations, manual blocks)
-- ----------------------------------------------------------------------------

create table blocked_dates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  reason text,
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_blocked_dates_tenant_range on blocked_dates (tenant_id, starts_at, ends_at);

-- ----------------------------------------------------------------------------
-- appointments — a client's booking
-- ----------------------------------------------------------------------------

create table appointments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  service_id uuid not null references services (id) on delete restrict,
  client_name text not null,
  client_phone text not null,
  client_email text,
  client_notes text,
  appointment_date date not null,
  start_time time not null,
  end_time time not null check (end_time > start_time),
  status appointment_status not null default 'PENDING_PAYMENT',
  total_price_cents integer not null check (total_price_cents > 0),
  deposit_amount_cents integer not null check (deposit_amount_cents > 0),
  hold_expires_at timestamptz not null,
  cancelled_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_appointments_tenant_date on appointments (tenant_id, appointment_date);
create index idx_appointments_tenant_status on appointments (tenant_id, status);
create index idx_appointments_hold_expiry on appointments (status, hold_expires_at)
  where status = 'PENDING_PAYMENT';
create index idx_appointments_client_phone on appointments (tenant_id, client_phone);

create trigger trg_appointments_updated_at
  before update on appointments
  for each row execute function set_updated_at();

-- Prevents two CONFIRMED (or awaiting-payment) bookings from overlapping the
-- same tenant + date + start_time slot. This is the real guarantee behind
-- "the time slot is held for 15 minutes" — a race between two clients
-- clicking the same slot resolves at the database level, not in app code.
create unique index uniq_appointments_active_slot
  on appointments (tenant_id, appointment_date, start_time)
  where status in ('PENDING_PAYMENT', 'CONFIRMED');

-- ----------------------------------------------------------------------------
-- payments — Mercado Pago PIX charges tied to an appointment
-- ----------------------------------------------------------------------------

create table payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  appointment_id uuid not null references appointments (id) on delete cascade,
  provider text not null default 'mercadopago',
  provider_payment_id text unique,
  status payment_status not null default 'PENDING',
  amount_cents integer not null check (amount_cents > 0),
  qr_code text,
  qr_code_base64 text,
  pix_copy_paste text,
  raw_payload jsonb,
  paid_at timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_payments_appointment_id on payments (appointment_id);
create index idx_payments_tenant_id on payments (tenant_id);
create index idx_payments_provider_payment_id on payments (provider_payment_id);

create trigger trg_payments_updated_at
  before update on payments
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------

alter table tenants enable row level security;
alter table profiles enable row level security;
alter table services enable row level security;
alter table availability enable row level security;
alter table blocked_dates enable row level security;
alter table appointments enable row level security;
alter table payments enable row level security;

-- Helper: is the current authenticated user staff of a given tenant?
create or replace function is_tenant_staff(target_tenant_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from profiles
    where profiles.id = auth.uid()
      and profiles.tenant_id = target_tenant_id
  );
$$;

-- tenants: public can read active tenants (needed to render the public
-- booking site by slug); only tenant staff can update their own tenant.
create policy "public can view active tenants"
  on tenants for select
  using (is_active = true);

create policy "staff can update own tenant"
  on tenants for update
  using (is_tenant_staff(id));

-- profiles: a user can see/update their own profile; staff can see
-- teammates within the same tenant.
create policy "users can view own profile"
  on profiles for select
  using (id = auth.uid() or is_tenant_staff(tenant_id));

create policy "users can update own profile"
  on profiles for update
  using (id = auth.uid());

-- services: public can read active services of active tenants; only staff
-- can manage the catalog.
create policy "public can view active services"
  on services for select
  using (
    is_active = true
    and exists (select 1 from tenants t where t.id = tenant_id and t.is_active)
  );

create policy "staff can manage services"
  on services for all
  using (is_tenant_staff(tenant_id))
  with check (is_tenant_staff(tenant_id));

-- availability / blocked_dates / appointments / payments: staff-only.
-- Guests never talk to these tables directly — only via server-side
-- Route Handlers using the service_role key (see src/lib/supabase/admin.ts).
create policy "staff can manage availability"
  on availability for all
  using (is_tenant_staff(tenant_id))
  with check (is_tenant_staff(tenant_id));

create policy "staff can manage blocked_dates"
  on blocked_dates for all
  using (is_tenant_staff(tenant_id))
  with check (is_tenant_staff(tenant_id));

create policy "staff can manage appointments"
  on appointments for all
  using (is_tenant_staff(tenant_id))
  with check (is_tenant_staff(tenant_id));

create policy "staff can view payments"
  on payments for select
  using (is_tenant_staff(tenant_id));

-- ----------------------------------------------------------------------------
-- Hold-expiration function — flips stale PENDING_PAYMENT appointments to
-- EXPIRED once their 15-minute hold has passed. Called on a schedule by the
-- Vercel Cron job hitting /api/cron/expire-holds (see README for setup).
-- ----------------------------------------------------------------------------

create or replace function expire_stale_appointment_holds()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  affected_count integer;
begin
  update appointments
  set status = 'EXPIRED'
  where status = 'PENDING_PAYMENT'
    and hold_expires_at < now();

  get diagnostics affected_count = row_count;
  return affected_count;
end;
$$;
