-- ----------------------------------------------------------------------------
-- tenant_payment_credentials — each salon's own Mercado Pago credentials.
--
-- This is a SEPARATE table from `tenants` on purpose: `tenants` has a
-- "public can view active tenants" SELECT policy (needed to render the
-- public booking site by slug), and RLS is row-level, not column-level —
-- a secret column living on `tenants` would be readable by anyone with the
-- anon key. Keeping credentials here means only tenant staff (and the
-- server_role admin client used by the payment/webhook routes) can ever
-- read them.
--
-- Each salon pays PIX deposits directly into ITS OWN Mercado Pago account:
-- this platform never touches the money, it only issues the charge using
-- the tenant's own access token.
-- ----------------------------------------------------------------------------

create table tenant_payment_credentials (
  tenant_id uuid primary key references tenants (id) on delete cascade,
  mercadopago_access_token text not null,
  mercadopago_webhook_secret text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_tenant_payment_credentials_updated_at
  before update on tenant_payment_credentials
  for each row execute function set_updated_at();

alter table tenant_payment_credentials enable row level security;

-- No public policy at all: only tenant staff can read/write their own
-- credentials (via the settings page), and the service_role key used by
-- /api/appointments and /api/webhooks/mercadopago bypasses RLS entirely.
create policy "staff can manage own payment credentials"
  on tenant_payment_credentials for all
  using (is_tenant_staff(tenant_id))
  with check (is_tenant_staff(tenant_id));
