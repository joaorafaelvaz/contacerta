import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// .env fica na raiz do monorepo; drizzle-kit roda com cwd em packages/db
config({ path: "../../.env" });
config();

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://meusaldo:meusaldo@localhost:5434/meusaldo",
  },
});
