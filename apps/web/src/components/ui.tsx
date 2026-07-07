import Link from "next/link";
import { InboxIcon } from "./icons";

export const inputClass =
  "w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 shadow-sm transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500 hover:border-slate-400 dark:hover:border-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20";
export const selectClass = inputClass;
/** select que não estica: para barras de filtro inline */
export const selectCompactClass = inputClass.replace("w-full ", "w-auto max-w-48 ");
export const primaryButtonClass =
  "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50";
export const secondaryButtonClass =
  "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 shadow-sm transition-all hover:border-emerald-300 dark:hover:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-800 dark:hover:text-emerald-300 active:scale-[0.98]";
export const dangerButtonClass =
  "inline-flex min-h-8 items-center justify-center rounded-md px-2.5 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 transition-colors hover:bg-red-50 dark:hover:bg-red-950/40";
/** ação pequena mas com área de toque adequada (ex: Pagar, Editar em listas) */
export const listActionClass =
  "inline-flex min-h-8 items-center justify-center rounded-md border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 transition-colors hover:border-emerald-300 dark:hover:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60";
export const ghostActionClass =
  "inline-flex min-h-8 items-center justify-center rounded-md px-2.5 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200";

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
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
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
      className={`rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm ${className}`}
    >
      {title && (
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
          {icon && <span className="text-emerald-600 dark:text-emerald-400 [&>svg]:h-4 [&>svg]:w-4">{icon}</span>}
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
      <InboxIcon className="h-8 w-8 text-slate-300 dark:text-slate-600" />
      <p className="text-sm text-slate-500 dark:text-slate-400">{message}</p>
      {action && (
        <Link
          href={action.href}
          className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 hover:underline"
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
      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{label}</span>
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
    default: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400",
    danger: "bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400",
    success: "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400",
  }[tone];
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${toneClasses} [&>svg]:h-5 [&>svg]:w-5`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <p className="truncate text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">{value}</p>
        {hint && <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
      </div>
    </div>
  );
}
