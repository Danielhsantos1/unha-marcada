import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server-side Supabase client for Server Components / Server Actions /
 * Route Handlers, running as the logged-in user (respects RLS + session
 * cookies). Use this for anything an authenticated admin does.
 *
 * For guest-facing writes that must bypass RLS (creating an appointment,
 * reading its payment status), use `src/lib/supabase/admin.ts` instead.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component that can't set cookies — safe
            // to ignore as long as middleware.ts refreshes the session.
          }
        },
      },
    },
  );
}
