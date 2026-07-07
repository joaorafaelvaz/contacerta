const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatBRL(cents: number): string {
  return brl.format(cents / 100);
}

/** Interpreta a string como número decimal, entendendo formatos pt-BR e en. */
function normalizeToNumber(input: string): number {
  const cleaned = input.replace(/[R$\s]/g, "");
  if (!cleaned) return Number.NaN;

  let normalized = cleaned;
  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");
  if (lastComma > -1 && lastDot > -1) {
    // Os dois presentes: o que aparece por último é o separador decimal
    normalized =
      lastComma > lastDot
        ? cleaned.replace(/\./g, "").replace(",", ".")
        : cleaned.replace(/,/g, "");
  } else if (lastComma > -1) {
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (lastDot > -1) {
    // Só ponto: "1.234" (milhar pt-BR) vs "12.34" (decimal). Trata como
    // milhar apenas quando seguido de exatamente 3 dígitos no fim.
    if (/^\d{1,3}(\.\d{3})+$/.test(cleaned)) normalized = cleaned.replace(/\./g, "");
  }
  return Number(normalized);
}

/**
 * Converte entrada do usuário em centavos. Aceita "1.234,56", "1234,56",
 * "1234.56", "R$ 250" e "250". Exige valor estritamente positivo (uso em
 * lançamentos) — para saldo inicial use parseSignedAmountToCents.
 */
export function parseAmountToCents(input: string): number {
  const value = normalizeToNumber(input);
  if (!Number.isFinite(value) || value <= 0) throw new Error(`Valor inválido: ${input}`);
  return Math.round(value * 100);
}

/**
 * Como parseAmountToCents, mas aceita zero e valores negativos — usado no saldo
 * inicial de uma conta (que pode começar zerada ou no vermelho). Vazio = 0.
 */
export function parseSignedAmountToCents(input: string): number {
  const trimmed = input.trim();
  if (!trimmed) return 0;
  const negative = trimmed.startsWith("-");
  const value = normalizeToNumber(trimmed.replace(/^-/, ""));
  if (!Number.isFinite(value) || value < 0) throw new Error(`Valor inválido: ${input}`);
  const cents = Math.round(value * 100);
  return negative ? -cents : cents;
}
