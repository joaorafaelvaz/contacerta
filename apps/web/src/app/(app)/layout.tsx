import { Nav } from "@/components/nav";
import { SignOutButton } from "@/components/sign-out-button";
import { requireFamily } from "@/lib/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireFamily();

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-4 p-4 md:flex-row">
      <aside className="shrink-0 md:w-48">
        <div className="mb-4 flex items-center justify-between md:block">
          <h1 className="text-lg font-bold text-emerald-700">MeuSaldo</h1>
          <div className="flex items-center gap-2 md:mt-1">
            <span className="text-xs text-slate-500">{user.name}</span>
            <SignOutButton />
          </div>
        </div>
        <Nav />
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
