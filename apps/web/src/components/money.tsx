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
  const color = signed ? (cents < 0 ? "text-red-600" : "text-emerald-700") : "";
  return <span className={`tabular-nums ${color} ${className}`}>{formatBRL(cents)}</span>;
}
