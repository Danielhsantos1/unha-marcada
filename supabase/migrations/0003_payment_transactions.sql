-- ----------------------------------------------------------------------------
-- payment_transactions — append-only financial ledger.
--
-- Every real money movement for an appointment (the PIX sinal, the final
-- payment collected in person, a controlled refund) becomes one row here.
-- Nothing is ever UPDATEd or DELETEd: there is no RLS policy for either
-- command, so even a staff session literally cannot modify or remove a
-- past entry — a mistake gets corrected with a new ESTORNO row, never by
-- rewriting history. This is what makes "relatórios financeiros 100%
-- confiáveis" true instead of aspirational: every number downstream is
-- derived from this table, never duplicated/cached on `appointments`
-- where it could drift out of sync.
-- ----------------------------------------------------------------------------

create type payment_method as enum ('PIX', 'DINHEIRO', 'CARTAO_DEBITO', 'CARTAO_CREDITO', 'OUTRO');
create type financial_transaction_type as enum ('SINAL', 'PAGAMENTO_FINAL', 'ESTORNO');

create table payment_transactions (
  id uuid primary key default gen_random_uuid(),
  -- Human-facing "Comprovante nº" — a simple, globally sequential number,
  -- not meant as a security token (that's `id`).
  receipt_number bigserial,
  tenant_id uuid not null references tenants (id) on delete cascade,
  appointment_id uuid not null references appointments (id) on delete cascade,
  type financial_transaction_type not null,
  amount_cents integer not null,
  method payment_method not null,
  note text,
  -- null = lançado automaticamente pelo webhook do Mercado Pago (o sinal);
  -- preenchido = staff que registrou um pagamento/estorno manualmente.
  recorded_by uuid references profiles (id) on delete set null,
  recorded_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint payment_transactions_amount_sign check (
    (type = 'ESTORNO' and amount_cents < 0) or (type <> 'ESTORNO' and amount_cents > 0)
  )
);

create index idx_payment_transactions_appointment on payment_transactions (appointment_id);
create index idx_payment_transactions_tenant_recorded on payment_transactions (tenant_id, recorded_at);

alter table payment_transactions enable row level security;

-- Staff can read and add entries for their own tenant. Deliberately no
-- UPDATE or DELETE policy — see the comment above.
create policy "staff can view payment_transactions"
  on payment_transactions for select
  using (is_tenant_staff(tenant_id));

create policy "staff can insert payment_transactions"
  on payment_transactions for insert
  with check (is_tenant_staff(tenant_id));

-- ----------------------------------------------------------------------------
-- appointment_payment_summary — the single source of truth for "how much
-- has this appointment actually received", derived live from the ledger
-- above. `security_invoker` makes the view respect the querying session's
-- own RLS instead of the view owner's — without it, this view would
-- silently bypass payment_transactions' tenant isolation.
-- ----------------------------------------------------------------------------

create view appointment_payment_summary
  with (security_invoker = true)
  as
  select
    a.id as appointment_id,
    a.tenant_id,
    a.total_price_cents,
    a.status as appointment_status,
    coalesce(sum(pt.amount_cents), 0)::integer as amount_received_cents,
    greatest(a.total_price_cents - coalesce(sum(pt.amount_cents), 0), 0)::integer as balance_due_cents,
    max(pt.recorded_at) as last_payment_at,
    (
      select pt2.receipt_number
      from payment_transactions pt2
      where pt2.appointment_id = a.id
      order by pt2.recorded_at desc, pt2.created_at desc
      limit 1
    ) as last_receipt_number
  from appointments a
  left join payment_transactions pt on pt.appointment_id = a.id
  group by a.id, a.tenant_id, a.total_price_cents, a.status;
