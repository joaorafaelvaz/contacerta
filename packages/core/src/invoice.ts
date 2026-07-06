import {
  addDaysISO,
  addMonthsYM,
  clampDay,
  type ISODate,
  makeDate,
  monthOfISO,
  parseISO,
  parseYM,
  type YearMonth,
} from "./dates";

// Convenções de fatura:
// - A fatura de competência M fecha em min(closingDay, últimoDia(M)).
// - O ciclo M cobre (fechamento de M-1, fechamento de M] — compra no dia do
//   fechamento pertence à fatura que fecha nesse dia.
// - O vencimento é a primeira ocorrência de dueDay estritamente após o fechamento.

/** Data de fechamento da fatura de competência `cycle`. */
export function closingDateFor(closingDay: number, cycle: YearMonth): ISODate {
  const { year, month } = parseYM(cycle);
  return makeDate(year, month, clampDay(year, month, closingDay));
}

/** Intervalo de datas (inclusive) coberto pela fatura de competência `cycle`. */
export function cycleRange(
  closingDay: number,
  cycle: YearMonth,
): { start: ISODate; end: ISODate } {
  const end = closingDateFor(closingDay, cycle);
  const prevClose = closingDateFor(closingDay, addMonthsYM(cycle, -1));
  return { start: addDaysISO(prevClose, 1), end };
}

/** Competência da fatura em que cai um lançamento de cartão na data `date`. */
export function invoiceCycleForDate(closingDay: number, date: ISODate): YearMonth {
  const cycle = monthOfISO(date);
  return date <= closingDateFor(closingDay, cycle) ? cycle : addMonthsYM(cycle, 1);
}

/** Vencimento da fatura de competência `cycle`. */
export function invoiceDueDate(closingDay: number, dueDay: number, cycle: YearMonth): ISODate {
  const close = closingDateFor(closingDay, cycle);
  const { year, month } = parseYM(cycle);
  const sameMonth = makeDate(year, month, clampDay(year, month, dueDay));
  if (sameMonth > close) return sameMonth;
  const next = parseYM(addMonthsYM(cycle, 1));
  return makeDate(next.year, next.month, clampDay(next.year, next.month, dueDay));
}

/**
 * Data dentro do ciclo `cycle` preservando (quando possível) o dia `preferredDay`.
 * Usada para posicionar parcelas de compras parceladas na fatura certa.
 */
export function dateInCycleWithDay(
  closingDay: number,
  cycle: YearMonth,
  preferredDay: number,
): ISODate {
  const { start, end } = cycleRange(closingDay, cycle);
  const { year, month } = parseYM(cycle);
  const inCycleMonth = makeDate(year, month, clampDay(year, month, preferredDay));
  if (inCycleMonth >= start && inCycleMonth <= end) return inCycleMonth;
  const prev = parseYM(addMonthsYM(cycle, -1));
  const inPrevMonth = makeDate(prev.year, prev.month, clampDay(prev.year, prev.month, preferredDay));
  if (inPrevMonth >= start && inPrevMonth <= end) return inPrevMonth;
  return end;
}
