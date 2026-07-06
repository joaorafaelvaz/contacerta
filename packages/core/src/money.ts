const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatBRL(cents: number): string {
  return brl.format(cents / 100);
}

/**
 * Converte entrada do usuário em centavos. Aceita "1.234,56", "1234,56",
 * "1234.56", "R$ 250" e "250".
 */
export function parseAmountToCents(input: string): number {
  const cleaned = input.replace(/[R$\s]/g, "");
  if (!cleaned) throw new Error("Valor vazio");

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

  const value = Number(normalized);
  if (!Number.isFinite(value) || value <= 0) throw new Error(`Valor inválido: ${input}`);
  return Math.round(value * 100);
}
