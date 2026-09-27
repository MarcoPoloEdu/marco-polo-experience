import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Authenticated job batch stub — processes persisted jobs when wired.
 * Requires CRON_SECRET; does not invent side effects.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET no configurado." },
      { status: 503 }
    );
  }
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Jobs collection processing lands in a later slice; acknowledge healthy cron auth.
  return NextResponse.json({
    ok: true,
    processed: 0,
    note: "Job runner scaffold — no side effects until jobs are enqueued post-payment.",
  });
}
