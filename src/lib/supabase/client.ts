import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client, used from Client Components.
 * Uses the public anon key — safe to ship to the browser because RLS
 * policies (see supabase/migrations/0001_init.sql) decide what it can read.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
