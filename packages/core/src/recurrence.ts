import { clampDay, type ISODate, makeDate, parseYM, type YearMonth } from "./dates";

/** Data de ocorrência de uma regra recorrente numa competência (dia clampado). */
export function occurrenceDate(dayOfMonth: number, competence: YearMonth): ISODate {
  const { year, month } = parseYM(competence);
  return makeDate(year, month, clampDay(year, month, dayOfMonth));
}
