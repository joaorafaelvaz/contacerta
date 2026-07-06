import { parseAmountToCents, todayISO } from "@meusaldo/core";

export function getString(form: FormData, key: string): string {
  const value = String(form.get(key) ?? "").trim();
  if (!value) throw new Error(`Campo obrigatório: ${key}`);
  return value;
}

export function getOptionalString(form: FormData, key: string): string | null {
  const value = String(form.get(key) ?? "").trim();
  return value || null;
}

export function getInt(form: FormData, key: string): number {
  const value = Number(getString(form, key));
  if (!Number.isInteger(value)) throw new Error(`Campo inválido: ${key}`);
  return value;
}

export function getMoneyCents(form: FormData, key: string): number {
  return parseAmountToCents(getString(form, key));
}

/** Campo de data (yyyy-mm-dd do <input type="date">); default hoje. */
export function getDate(form: FormData, key: string): string {
  const value = getOptionalString(form, key);
  if (!value) return todayISO();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(`Data inválida: ${key}`);
  return value;
}

/** Origem "acc:<id>" ou "card:<id>" do seletor combinado de conta/cartão. */
export function getSource(form: FormData, key = "source"): {
  accountId: string | null;
  creditCardId: string | null;
} {
  const raw = getString(form, key);
  if (raw.startsWith("acc:")) return { accountId: raw.slice(4), creditCardId: null };
  if (raw.startsWith("card:")) return { accountId: null, creditCardId: raw.slice(5) };
  throw new Error("Selecione uma conta ou cartão");
}
