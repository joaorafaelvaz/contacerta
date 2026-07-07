import { Nav } from "@/components/nav";
import { SignOutButton } from "@/components/sign-out-button";
import { requireFamily } from "@/lib/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireFamily();
  const initial = user.name.trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-4 p-4 md:flex-row md:gap-6 md:p-6">
      <aside className="shrink-0 md:flex md:w-52 md:flex-col">
        <div className="mb-3 flex items-center justify-between md:mb-6 md:block">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white shadow-sm">
              M$
            </span>
            <h1 className="text-lg font-bold tracking-tight text-emerald-800">MeuSaldo</h1>
          </div>
          {/* usuário no topo só no mobile; no desktop desce para o rodapé da sidebar */}
          <div className="flex items-center gap-2 md:hidden">
            <span className="text-xs text-slate-500">{user.name}</span>
            <SignOutButton />
          </div>
        </div>
        <Nav />
        <div className="mt-auto hidden items-center gap-2.5 border-t border-slate-200 pt-4 md:flex">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">
            {initial}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-700">{user.name}</p>
            <SignOutButton />
          </div>
        </div>
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
