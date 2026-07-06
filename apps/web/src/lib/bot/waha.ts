import type { NotificationChannel } from "@meusaldo/core";

export function wahaConfigured(): boolean {
  return Boolean(process.env.WAHA_URL);
}

/**
 * Canal WhatsApp via WAHA (não-oficial). Trocar pela API oficial da Meta =
 * escrever outro NotificationChannel; o resto do sistema não muda.
 */
export class WahaChannel implements NotificationChannel {
  async send(recipient: string, message: string): Promise<void> {
    const url = process.env.WAHA_URL;
    if (!url) throw new Error("WAHA_URL não configurada");
    const chatId = recipient.includes("@") ? recipient : `${recipient}@c.us`;

    const res = await fetch(`${url.replace(/\/+$/, "")}/api/sendText`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.WAHA_API_KEY ? { "X-Api-Key": process.env.WAHA_API_KEY } : {}),
      },
      body: JSON.stringify({
        chatId,
        text: message,
        session: process.env.WAHA_SESSION ?? "default",
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      throw new Error(`WAHA sendText falhou: ${res.status} ${await res.text()}`);
    }
  }
}
