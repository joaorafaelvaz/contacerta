import { Nav } from "@/components/nav";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
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
            <h1 className="text-lg font-bold tracking-tight text-emerald-800 dark:text-emerald-300">MeuSaldo</h1>
          </div>
          {/* usuário no topo só no mobile; no desktop desce para o rodapé da sidebar */}
          <div className="flex items-center gap-2 md:hidden">
            <span className="text-xs text-slate-500 dark:text-slate-400">{user.name}</span>
            <SignOutButton />
            <ThemeToggle />
          </div>
        </div>
        <Nav />
        <div className="mt-auto hidden items-center gap-2.5 border-t border-slate-200 dark:border-slate-700 pt-4 md:flex">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            {initial}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-300">{user.name}</p>
            <SignOutButton />
          </div>
          <ThemeToggle />
        </div>
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
