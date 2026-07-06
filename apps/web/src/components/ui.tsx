import Link from "next/link";

export const inputClass =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none";
export const selectClass = inputClass;
export const primaryButtonClass =
  "inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50";
export const secondaryButtonClass =
  "inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50";
export const dangerButtonClass =
  "inline-flex items-center justify-center rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50";

export function PageHeader({
  title,
  action,
}: {
  title: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-xl font-bold text-slate-800">{title}</h1>
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
  children,
  className = "",
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl bg-white p-4 shadow-sm ${className}`}>
      {title && <h2 className="mb-3 text-sm font-semibold text-slate-600">{title}</h2>}
      {children}
    </section>
  );
}

export function EmptyState({ message }: { message: string }) {
  return <p className="py-8 text-center text-sm text-slate-400">{message}</p>;
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      {children}
    </label>
  );
}
