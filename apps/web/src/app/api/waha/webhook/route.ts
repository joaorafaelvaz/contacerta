import { handleBotMessage } from "@/lib/bot/router";
import { WahaChannel } from "@/lib/bot/waha";
import { normalizePhoneBR, phoneCandidatesBR } from "@meusaldo/core";
import { db, schema } from "@meusaldo/db";
import { eq, inArray } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";

const ok = () => NextResponse.json({ ok: true });

export async function POST(req: NextRequest) {
  const secret = process.env.WAHA_WEBHOOK_SECRET;
  // sem secret o endpoint fica aberto na internet e qualquer um poderia criar
  // lançamentos: em produção isso é erro de configuração, não modo permissivo
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        "[bot] WAHA_WEBHOOK_SECRET não configurado — webhook recusado. Defina a variável e recrie o container.",
      );
      return NextResponse.json({ error: "webhook not configured" }, { status: 503 });
    }
    console.warn("[bot] WAHA_WEBHOOK_SECRET vazio (permitido só fora de produção)");
  } else if (req.headers.get("x-webhook-secret") !== secret) {
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
  if (!phone) {
    console.log(`[bot] mensagem ignorada: remetente inválido (${from})`);
    return ok();
  }

  // busca pelas variantes com/sem o nono dígito (o JID do WhatsApp costuma
  // omitir o 9 que o usuário digita ao cadastrar o número)
  const candidates = phoneCandidatesBR(phone);
  const [user] = await db
    .select({ id: schema.users.id, familyId: schema.users.familyId, phone: schema.users.phone })
    .from(schema.users)
    .where(inArray(schema.users.phone, candidates));
  // número não vinculado: ignora (segurança) — resposta ao caller continua ok
  if (!user?.familyId) {
    console.log(`[bot] mensagem ignorada: número não vinculado a nenhum usuário (${phone})`);
    return ok();
  }

  // auto-corrige o cadastro para a grafia do JID: garante que envios ativos
  // (resumo diário) usem o endereço que o WhatsApp de fato entrega
  if (user.phone !== phone) {
    console.log(`[bot] atualizando telefone do usuário para a grafia do WhatsApp (${user.phone} → ${phone})`);
    await db
      .update(schema.users)
      .set({ phone, updatedAt: new Date() })
      .where(eq(schema.users.id, user.id));
  }

  console.log(`[bot] ${phone}: "${text.slice(0, 60)}" — processando...`);
  try {
    const reply = await handleBotMessage(db, { userId: user.id, familyId: user.familyId }, text);
    console.log(`[bot] resposta: "${reply.slice(0, 100).replace(/\n/g, " · ")}"`);
    await new WahaChannel().send(from, reply);
    console.log("[bot] resposta enviada via WAHA");
  } catch (err) {
    console.error("[bot] erro ao processar/enviar:", err);
    try {
      await new WahaChannel().send(from, "😵 Algo deu errado ao processar sua mensagem. Tente de novo.");
    } catch {
      // WAHA fora do ar: nada a fazer
    }
  }
  return ok();
}
