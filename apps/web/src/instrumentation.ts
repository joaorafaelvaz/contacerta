/**
 * O corpo fica em instrumentation-node.ts, importado só quando o runtime é
 * Node — o padrão com a condição inline permite ao bundler descartar o import
 * nos alvos edge/client (postgres/node-cron usam módulos nativos do Node).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { registerNode } = await import("./instrumentation-node");
    await registerNode();
  }
}
