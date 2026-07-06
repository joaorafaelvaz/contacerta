import { db } from "@meusaldo/db";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import cron from "node-cron";
import { sendDailyDigests } from "./lib/bot/digest";

/**
 * Roda uma vez na subida do servidor (runtime Node): migrations em produção
 * (RUN_MIGRATIONS=true no Docker) e agendador do resumo diário no WhatsApp
 * (apenas quando WAHA_URL está configurada).
 */
export async function registerNode() {
  if (process.env.RUN_MIGRATIONS === "true") {
    const migrationsFolder = process.env.MIGRATIONS_DIR ?? "../../packages/db/drizzle";
    await migrate(db, { migrationsFolder });
    console.log("[meusaldo] migrations aplicadas");
  }

  if (process.env.WAHA_URL) {
    // evita agendar duas vezes no hot reload do dev
    const g = globalThis as unknown as { __meusaldoCron?: boolean };
    if (g.__meusaldoCron) return;
    g.__meusaldoCron = true;

    const expr = process.env.REMINDER_CRON ?? "0 8 * * *";
    cron.schedule(expr, () => {
      sendDailyDigests(db).catch((err) => console.error("[digest] erro:", err));
    });
    console.log(`[meusaldo] resumo diário agendado (${expr})`);
  }
}
