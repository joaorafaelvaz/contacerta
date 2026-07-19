import type { ISODate } from "./dates";
import { formatBRL } from "./money";

// ---------------------------------------------------------------------------
// Telefone
// ---------------------------------------------------------------------------

/**
 * Normaliza um telefone para dígitos com DDI (ex: "5511999999999").
 * Números com 10–11 dígitos são assumidos como brasileiros (prefixa 55).
 * Aceita também o formato de chat do WAHA ("5511999999999@c.us").
 */
export function normalizePhoneBR(input: string): string | null {
  const digits = input.replace(/@.*$/, "").replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) return null;
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
}

/**
 * Variantes brasileiras equivalentes do número: com e sem o nono dígito.
 * O JID do WhatsApp usa a forma SEM o nono dígito para muitas contas BR
 * (ex: 554899073477), enquanto o número real tem 13 dígitos (5548999073477).
 * Buscar pelas duas variantes evita que o vínculo falhe por grafia.
 */
export function phoneCandidatesBR(input: string): string[] {
  const phone = normalizePhoneBR(input);
  if (!phone) return [];
  const candidates = new Set([phone]);
  if (phone.startsWith("55")) {
    const local = phone.slice(2); // DDD + assinante
    if (local.length === 11 && local[2] === "9") {
      candidates.add(`55${local.slice(0, 2)}${local.slice(3)}`); // remove o nono dígito
    } else if (local.length === 10) {
      candidates.add(`55${local.slice(0, 2)}9${local.slice(2)}`); // insere o nono dígito
    }
  }
  return [...candidates];
}

// ---------------------------------------------------------------------------
// Comandos fixos (resolvidos sem LLM)
// ---------------------------------------------------------------------------

export type FixedCommand =
  | { kind: "saldo" }
  | { kind: "fatura" }
  | { kind: "contas" }
  | { kind: "paguei"; term: string }
  | { kind: "ajuda" };

export function parseFixedCommand(text: string): FixedCommand | null {
  const t = text.trim().toLowerCase().replace(/[!?.]+$/, "");
  if (["saldo", "saldos"].includes(t)) return { kind: "saldo" };
  if (["fatura", "faturas", "cartao", "cartão", "cartões", "cartoes"].includes(t))
    return { kind: "fatura" };
  if (["contas", "pendentes", "vencimentos", "contas a pagar", "a pagar"].includes(t))
    return { kind: "contas" };
  if (["ajuda", "help", "menu", "comandos", "oi", "olá", "ola"].includes(t))
    return { kind: "ajuda" };
  const paguei = t.match(/^(?:paguei|pagar|quitei)\s+(?:a\s+|o\s+)?(.{2,})$/);
  if (paguei?.[1]) return { kind: "paguei", term: paguei[1].trim() };
  return null;
}

export const HELP_MESSAGE = [
  "🤖 *MeuSaldo* — comandos:",
  "• *saldo* — saldo das contas",
  "• *fatura* — fatura atual dos cartões",
  "• *contas* — contas a pagar",
  "• *paguei <nome>* — marca conta como paga",
  "",
  "Ou escreva o lançamento em linguagem natural:",
  '• "mercado 250 nubank"',
  '• "recebi 500 de freela na carteira"',
  '• "notebook 1200 em 3x no cartão nubank"',
].join("\n");

// ---------------------------------------------------------------------------
// Formatadores de resposta
// ---------------------------------------------------------------------------

const dbr = (iso: ISODate) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

export function formatBalances(
  accounts: { name: string; balanceCents: number }[],
): string {
  if (accounts.length === 0) return "Nenhuma conta cadastrada.";
  const lines = accounts.map((a) => `• ${a.name}: ${formatBRL(a.balanceCents)}`);
  const total = accounts.reduce((acc, a) => acc + a.balanceCents, 0);
  return ["💰 *Saldo das contas*", ...lines, "", `*Total: ${formatBRL(total)}*`].join("\n");
}

export function formatInvoices(
  invoices: { cardName: string; totalCents: number; dueDate: ISODate; cycle: string }[],
): string {
  if (invoices.length === 0) return "Nenhum cartão cadastrado.";
  const lines = invoices.map(
    (i) => `• ${i.cardName}: ${formatBRL(i.totalCents)} (vence ${dbr(i.dueDate)})`,
  );
  return ["💳 *Fatura atual dos cartões*", ...lines].join("\n");
}

export function formatPendingBills(
  bills: { description: string; amountCents: number; dueDate: ISODate | null }[],
  today: ISODate,
): string {
  if (bills.length === 0) return "Nenhuma conta a pagar nos próximos 30 dias. 🎉";
  const lines = bills.map((b) => {
    const overdue = b.dueDate && b.dueDate < today;
    const due = b.dueDate ? `${overdue ? "⚠️ venceu" : "vence"} ${dbr(b.dueDate)}` : "sem data";
    return `• ${b.description}: ${formatBRL(b.amountCents)} (${due})`;
  });
  return ["📋 *Contas a pagar*", ...lines].join("\n");
}

export interface DigestData {
  overdue: { description: string; amountCents: number; dueDate: ISODate }[];
  dueToday: { description: string; amountCents: number }[];
  dueTomorrow: { description: string; amountCents: number }[];
  invoices: { cardName: string; totalCents: number; dueDate: ISODate }[];
}

/** Resumo diário. Retorna null quando não há nada a avisar (não enviar). */
export function formatDigest(data: DigestData): string | null {
  const parts: string[] = [];
  if (data.overdue.length > 0) {
    parts.push(
      "⚠️ *Atrasadas:*",
      ...data.overdue.map(
        (b) => `• ${b.description}: ${formatBRL(b.amountCents)} (venceu ${dbr(b.dueDate)})`,
      ),
    );
  }
  if (data.dueToday.length > 0) {
    parts.push(
      "📅 *Vencem hoje:*",
      ...data.dueToday.map((b) => `• ${b.description}: ${formatBRL(b.amountCents)}`),
    );
  }
  if (data.dueTomorrow.length > 0) {
    parts.push(
      "🔜 *Vencem amanhã:*",
      ...data.dueTomorrow.map((b) => `• ${b.description}: ${formatBRL(b.amountCents)}`),
    );
  }
  if (data.invoices.length > 0) {
    parts.push(
      "💳 *Faturas próximas:*",
      ...data.invoices.map(
        (i) => `• ${i.cardName}: ${formatBRL(i.totalCents)} (vence ${dbr(i.dueDate)})`,
      ),
    );
  }
  if (parts.length === 0) return null;
  return ["☀️ *Bom dia! Resumo do MeuSaldo:*", "", ...parts].join("\n");
}

// ---------------------------------------------------------------------------
// Intenção extraída pelo LLM (validação do JSON retornado)
// ---------------------------------------------------------------------------

export interface LlmIntent {
  intent: "transaction" | "installment" | "unknown";
  type: "expense" | "income";
  amount: number; // em reais (o LLM devolve decimal)
  description: string;
  source: string;
  category: string;
  installments: number;
}

/**
 * Extrai o objeto JSON da resposta de um LLM, tolerando cercas de markdown
 * (```json ... ```) e texto ao redor — modelos cloud costumam ignorar o
 * parâmetro `format` e embrulhar a resposta.
 */
export function extractLlmJson(content: string): unknown | null {
  let t = content.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fence?.[1]) t = fence[1].trim();
  if (!t.startsWith("{")) {
    const start = t.indexOf("{");
    const end = t.lastIndexOf("}");
    if (start === -1 || end <= start) return null;
    t = t.slice(start, end + 1);
  }
  try {
    return JSON.parse(t);
  } catch {
    return null;
  }
}

/** Valida/sanitiza o JSON vindo do LLM; retorna null se inutilizável. */
export function validateLlmIntent(raw: unknown): LlmIntent | null {
  if (typeof raw !== "object" || raw === null) return null;
  const o = raw as Record<string, unknown>;
  const intent = o.intent === "transaction" || o.intent === "installment" ? o.intent : "unknown";
  if (intent === "unknown") return null;
  const amount = typeof o.amount === "number" ? o.amount : Number(o.amount);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  const description = String(o.description ?? "").trim();
  if (!description) return null;
  const installments = Math.trunc(Number(o.installments ?? 1)) || 1;
  if (intent === "installment" && installments < 2) return null;
  return {
    intent,
    type: o.type === "income" ? "income" : "expense",
    amount,
    description,
    source: String(o.source ?? "").trim(),
    category: String(o.category ?? "").trim(),
    installments,
  };
}

/** Encontra conta/cartão pelo nome citado (case-insensitive, contém). */
export function matchByName<T extends { name: string }>(items: T[], hint: string): T | null {
  if (!hint) return items.length === 1 ? (items[0] ?? null) : null;
  const h = hint.toLowerCase();
  const exact = items.find((i) => i.name.toLowerCase() === h);
  if (exact) return exact;
  const contains = items.filter(
    (i) => i.name.toLowerCase().includes(h) || h.includes(i.name.toLowerCase()),
  );
  if (contains.length === 1) return contains[0] ?? null;
  return items.length === 1 ? (items[0] ?? null) : null;
}
