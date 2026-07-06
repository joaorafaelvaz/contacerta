import { handleBotMessage } from "@/lib/bot/router";
import { WahaChannel } from "@/lib/bot/waha";
import { normalizePhoneBR } from "@meusaldo/core";
import { db, schema } from "@meusaldo/db";
import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";

const ok = () => NextResponse.json({ ok: true });

export async function POST(req: NextRequest) {
  const secret = process.env.WAHA_WEBHOOK_SECRET;
  if (secret && req.headers.get("x-webhook-secret") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { event?: string; payload?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  if (body.event !== "message" && body.event !== "message.any") return ok();
  const p = body.payload ?? {};
  const text = typeof p.body === "string" ? p.body.trim() : "";
  const from = typeof p.from === "string" ? p.from : "";
  if (!text || !from) return ok();
  // mensagens enviadas pelo próprio bot: só processa no chat consigo mesmo
  if (p.fromMe && p.from !== p.to) return ok();

  const phone = normalizePhoneBR(from);
  if (!phone) return ok();

  const [user] = await db
    .select({ id: schema.users.id, familyId: schema.users.familyId })
    .from(schema.users)
    .where(eq(schema.users.phone, phone));
  // número não vinculado: ignora em silêncio (segurança)
  if (!user?.familyId) return ok();

  try {
    const reply = await handleBotMessage(db, { userId: user.id, familyId: user.familyId }, text);
    await new WahaChannel().send(from, reply);
  } catch (err) {
    console.error("[bot] erro ao processar mensagem:", err);
    try {
      await new WahaChannel().send(from, "😵 Algo deu errado ao processar sua mensagem. Tente de novo.");
    } catch {
      // WAHA fora do ar: nada a fazer
    }
  }
  return ok();
}
