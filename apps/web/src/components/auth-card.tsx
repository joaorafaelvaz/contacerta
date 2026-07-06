export function AuthCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow">
        <h1 className="mb-1 text-center text-2xl font-bold text-emerald-700">MeuSaldo</h1>
        <h2 className="mb-6 text-center text-sm text-slate-500">{title}</h2>
        {children}
      </div>
    </main>
  );
}

export const inputClass =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none";
export const buttonClass =
  "w-full rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50";
