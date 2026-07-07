import { formatBRL } from "@meusaldo/core";

export function Money({
  cents,
  signed = false,
  className = "",
}: {
  cents: number;
  signed?: boolean;
  className?: string;
}) {
  const color = signed ? (cents < 0 ? "text-red-600 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400") : "";
  return <span className={`tabular-nums ${color} ${className}`}>{formatBRL(cents)}</span>;
}
