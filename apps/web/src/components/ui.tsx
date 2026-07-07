import Link from "next/link";
import { InboxIcon } from "./icons";

export const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-colors placeholder:text-slate-400 hover:border-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20";
export const selectClass = inputClass;
/** select que não estica: para barras de filtro inline */
export const selectCompactClass = inputClass.replace("w-full ", "w-auto max-w-48 ");
export const primaryButtonClass =
  "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50";
export const secondaryButtonClass =
  "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 active:scale-[0.98]";
export const dangerButtonClass =
  "inline-flex min-h-8 items-center justify-center rounded-md px-2.5 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50";
/** ação pequena mas com área de toque adequada (ex: Pagar, Editar em listas) */
export const listActionClass =
  "inline-flex min-h-8 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:border-emerald-300 hover:bg-emerald-100";
export const ghostActionClass =
  "inline-flex min-h-8 items-center justify-center rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action && (
        <Link href={action.href} className={primaryButtonClass}>
          {action.label}
        </Link>
      )}
    </div>
  );
}

export function Card({
  title,
  icon,
  children,
  className = "",
}: {
  title?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm ${className}`}
    >
      {title && (
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700">
          {icon && <span className="text-emerald-600 [&>svg]:h-4 [&>svg]:w-4">{icon}</span>}
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}

export function EmptyState({
  message,
  action,
}: {
  message: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center">
      <InboxIcon className="h-8 w-8 text-slate-300" />
      <p className="text-sm text-slate-500">{message}</p>
      {action && (
        <Link
          href={action.href}
          className="text-sm font-semibold text-emerald-700 hover:underline"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      {children}
    </label>
  );
}

/** Cartão de indicador: número grande com rótulo e ícone. */
export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon: React.ReactNode;
  tone?: "default" | "danger" | "success";
}) {
  const toneClasses = {
    default: "bg-emerald-50 text-emerald-600",
    danger: "bg-red-50 text-red-600",
    success: "bg-emerald-50 text-emerald-600",
  }[tone];
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${toneClasses} [&>svg]:h-5 [&>svg]:w-5`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="truncate text-lg font-bold tracking-tight text-slate-900">{value}</p>
        {hint && <p className="text-xs text-slate-500">{hint}</p>}
      </div>
    </div>
  );
}
