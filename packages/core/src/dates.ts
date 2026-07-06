// Datas como strings ISO ("YYYY-MM-DD") e competências ("YYYY-MM"),
// sem objetos Date para lançamentos — evita qualquer deslize de timezone.

export type ISODate = string; // YYYY-MM-DD
export type YearMonth = string; // YYYY-MM

export function daysInMonth(year: number, month: number): number {
  // month 1-12; dia 0 do mês seguinte = último dia do mês (UTC evita DST)
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function clampDay(year: number, month: number, day: number): number {
  return Math.min(day, daysInMonth(year, month));
}

const pad = (n: number, len: number) => String(n).padStart(len, "0");

export function makeDate(year: number, month: number, day: number): ISODate {
  return `${pad(year, 4)}-${pad(month, 2)}-${pad(day, 2)}`;
}

export function parseISO(date: ISODate): { year: number; month: number; day: number } {
  const [y, m, d] = date.split("-").map(Number);
  if (!y || !m || !d) throw new Error(`Data inválida: ${date}`);
  return { year: y, month: m, day: d };
}

export function ym(year: number, month: number): YearMonth {
  return `${pad(year, 4)}-${pad(month, 2)}`;
}

export function parseYM(value: YearMonth): { year: number; month: number } {
  const [y, m] = value.split("-").map(Number);
  if (!y || !m) throw new Error(`Competência inválida: ${value}`);
  return { year: y, month: m };
}

export function addMonthsYM(value: YearMonth, delta: number): YearMonth {
  const { year, month } = parseYM(value);
  const total = year * 12 + (month - 1) + delta;
  return ym(Math.floor(total / 12), (total % 12) + 1);
}

export function monthOfISO(date: ISODate): YearMonth {
  return date.slice(0, 7);
}

export function addDaysISO(date: ISODate, delta: number): ISODate {
  const { year, month, day } = parseISO(date);
  const d = new Date(Date.UTC(year, month - 1, day + delta));
  return makeDate(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

/** Data local de hoje (fuso do servidor). */
export function todayISO(): ISODate {
  const now = new Date();
  return makeDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

/** Comparação lexicográfica funciona para ISO: a < b ⇒ retorno negativo. */
export function compareISO(a: ISODate, b: ISODate): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
