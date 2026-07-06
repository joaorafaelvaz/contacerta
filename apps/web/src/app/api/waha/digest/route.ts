import { sendDailyDigests } from "@/lib/bot/digest";
import { db } from "@meusaldo/db";
import { NextResponse, type NextRequest } from "next/server";

/** Dispara o resumo diário manualmente (mesmo secret do webhook). */
export async function POST(req: NextRequest) {
  const secret = process.env.WAHA_WEBHOOK_SECRET;
  if (secret && req.headers.get("x-webhook-secret") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  await sendDailyDigests(db);
  return NextResponse.json({ ok: true });
}
