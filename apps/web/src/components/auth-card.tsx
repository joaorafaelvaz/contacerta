export function AuthCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-emerald-50 via-slate-100 to-slate-100 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200/80 bg-white p-6 shadow-lg shadow-emerald-900/5">
        <div className="mb-1 flex items-center justify-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-sm font-bold text-white shadow-sm">
            M$
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-emerald-800">MeuSaldo</h1>
        </div>
        <h2 className="mb-6 text-center text-sm text-slate-500">{title}</h2>
        {children}
      </div>
    </main>
  );
}

export const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20";
export const buttonClass =
  "w-full min-h-11 rounded-lg bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-50";
