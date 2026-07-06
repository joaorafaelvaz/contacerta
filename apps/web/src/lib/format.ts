export { formatBRL } from "@meusaldo/core";

/** "2026-03-05" → "05/03/2026" (sem passar por Date/timezone). */
export function formatDateBR(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

const MONTHS_PT = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

/** "2026-03" → "março de 2026" */
export function formatMonthPT(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return `${MONTHS_PT[(m ?? 1) - 1]} de ${y}`;
}
