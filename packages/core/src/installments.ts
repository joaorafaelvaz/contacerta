import { addMonthsYM, type ISODate, parseISO, type YearMonth } from "./dates";
import { dateInCycleWithDay, invoiceCycleForDate } from "./invoice";

/**
 * Divide um total em N parcelas inteiras (centavos), com o resto na primeira:
 * 10000/3 → [3334, 3333, 3333].
 */
export function splitInstallments(totalCents: number, installments: number): number[] {
  if (!Number.isInteger(totalCents) || totalCents <= 0)
    throw new Error("Valor total deve ser um inteiro positivo de centavos");
  if (!Number.isInteger(installments) || installments < 1)
    throw new Error("Número de parcelas deve ser inteiro >= 1");
  const base = Math.floor(totalCents / installments);
  const remainder = totalCents - base * installments;
  return Array.from({ length: installments }, (_, i) => (i === 0 ? base + remainder : base));
}

export interface InstallmentItem {
  number: number; // 1..N
  amountCents: number;
  date: ISODate;
  cycle: YearMonth;
}

/**
 * Plano de parcelas: a 1ª cai na fatura da data da compra, as demais em
 * ciclos consecutivos, preservando o dia da compra quando possível.
 */
export function installmentPlan(input: {
  totalCents: number;
  installments: number;
  purchaseDate: ISODate;
  closingDay: number;
}): InstallmentItem[] {
  const { totalCents, installments, purchaseDate, closingDay } = input;
  const amounts = splitInstallments(totalCents, installments);
  const firstCycle = invoiceCycleForDate(closingDay, purchaseDate);
  const preferredDay = parseISO(purchaseDate).day;

  return amounts.map((amountCents, i) => {
    const cycle = addMonthsYM(firstCycle, i);
    const date = i === 0 ? purchaseDate : dateInCycleWithDay(closingDay, cycle, preferredDay);
    return { number: i + 1, amountCents, date, cycle };
  });
}
