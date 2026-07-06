import type { NextConfig } from "next";
import { config } from "dotenv";
import path from "node:path";

// .env único na raiz do monorepo
config({ path: path.resolve(__dirname, "../../.env") });

const nextConfig: NextConfig = {
  transpilePackages: ["@meusaldo/core", "@meusaldo/db"],
  output: "standalone",
};

export default nextConfig;
