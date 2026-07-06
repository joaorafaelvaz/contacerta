/**
 * Roda uma vez na subida do servidor. Em produção (RUN_MIGRATIONS=true no
 * Docker) aplica as migrations pendentes antes de aceitar tráfego.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.RUN_MIGRATIONS === "true") {
    const { migrate } = await import("drizzle-orm/postgres-js/migrator");
    const { db } = await import("@meusaldo/db");
    const migrationsFolder = process.env.MIGRATIONS_DIR ?? "../../packages/db/drizzle";
    await migrate(db, { migrationsFolder });
    console.log("[meusaldo] migrations aplicadas");
  }
}
