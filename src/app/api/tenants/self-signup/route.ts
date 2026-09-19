import { NextResponse } from "next/server";
import { provisionTenant } from "@/lib/tenant/provision";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

/**
 * Public self-signup — anyone can create a tenant here, unlike
 * /painel-mestre which is gated to the platform operator. The rate limit
 * is tighter than /api/appointments (3/hour vs 8/minute) because this
 * creates a full tenant + Auth login, not just a booking hold.
 */
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`self-signup:${ip}`, {
    limit: 3,
    windowMs: 3_600_000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Muitas tentativas. Tente novamente mais tarde." },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const result = await provisionTenant(body);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json(result.data, { status: 201 });
}
