import { type LlmIntent, validateLlmIntent } from "@meusaldo/core";

const INTENT_SCHEMA = {
  type: "object",
  properties: {
    intent: { type: "string", enum: ["transaction", "installment", "unknown"] },
    type: { type: "string", enum: ["expense", "income"] },
    amount: { type: "number" },
    description: { type: "string" },
    source: { type: "string" },
    category: { type: "string" },
    installments: { type: "integer" },
  },
  required: ["intent", "type", "amount", "description", "source", "category", "installments"],
} as const;

export interface IntentContext {
  accounts: string[];
  cards: string[];
  categories: string[];
  today: string;
}

function systemPrompt(ctx: IntentContext): string {
  return [
    "Você extrai lançamentos financeiros de mensagens em português do Brasil.",
    "Responda SOMENTE com o JSON pedido.",
    "",
    `Contas do usuário: ${ctx.accounts.join(", ") || "(nenhuma)"}`,
    `Cartões de crédito: ${ctx.cards.join(", ") || "(nenhum)"}`,
    `Categorias: ${ctx.categories.join(", ") || "(nenhuma)"}`,
    `Data de hoje: ${ctx.today}`,
    "",
    "Regras:",
    '- "intent": "transaction" para gasto/receita simples; "installment" quando a mensagem indica parcelas (ex: "em 3x", "parcelado em 10 vezes"); "unknown" se a mensagem NÃO descreve um lançamento financeiro.',
    '- "type": "expense" para gastos, "income" para receitas (recebi, ganhei, salário caiu).',
    '- "amount": valor em reais como número decimal (ex: 250.5). Interprete formato brasileiro: "1.234,56" = 1234.56.',
    '- "description": descrição curta e capitalizada do lançamento (ex: "Mercado", "Freela").',
    '- "source": copie EXATAMENTE o nome da conta ou cartão da lista acima que a mensagem cita; se citar cartão, use o nome do cartão. Vazio se não citar.',
    '- "category": a categoria da lista acima que melhor descreve o lançamento; vazio se nenhuma servir.',
    '- "installments": número de parcelas (1 se não for parcelado).',
  ].join("\n");
}

/** Extrai a intenção via Ollama. Retorna null se indisponível ou sem confiança. */
export async function extractIntent(
  text: string,
  ctx: IntentContext,
): Promise<LlmIntent | null> {
  const url = (process.env.OLLAMA_URL ?? "http://localhost:11434").replace(/\/+$/, "");
  const model = process.env.OLLAMA_MODEL ?? "llama3.2";
  try {
    const res = await fetch(`${url}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        stream: false,
        format: INTENT_SCHEMA,
        options: { temperature: 0 },
        messages: [
          { role: "system", content: systemPrompt(ctx) },
          { role: "user", content: text },
        ],
      }),
      signal: AbortSignal.timeout(60_000),
    });
    if (!res.ok) {
      console.error(`[bot] Ollama respondeu ${res.status}`);
      return null;
    }
    const data = (await res.json()) as { message?: { content?: string } };
    return validateLlmIntent(JSON.parse(data.message?.content ?? "{}"));
  } catch (err) {
    console.error("[bot] Ollama indisponível:", err);
    return null;
  }
}
