import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Privileged Supabase client using the `service_role` key. This BYPASSES
 * Row Level Security entirely — it can read and write any tenant's data.
 *
 * The `server-only` import above makes the build fail if any Client
 * Component ever tries to import this file, so the service_role key can
 * never accidentally leak to the browser bundle.
 *
 * Use this ONLY inside Route Handlers / Server Actions that:
 *   1. never trust client-submitted prices or slot data (recompute them),
 *   2. return the minimum data the guest actually needs.
 *
 * This is how a guest can create an appointment or check a payment status
 * without needing an account — the appointment's UUID acts like a bearer
 * token (the same pattern Stripe Checkout uses for guest sessions).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_URL não configuradas.",
    );
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
