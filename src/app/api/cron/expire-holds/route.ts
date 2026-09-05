import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Called by Vercel Cron every minute (see vercel.json) to flip
 * PENDING_PAYMENT appointments whose 15-minute hold has expired over to
 * EXPIRED, freeing the slot. Protected by CRON_SECRET so it can't be
 * triggered by random internet traffic.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("expire_stale_appointment_holds");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ expiredCount: data ?? 0 });
}
