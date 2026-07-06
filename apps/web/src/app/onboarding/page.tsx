import { acceptInviteAction, createFamilyAction } from "@/actions/family";
import { AuthCard, buttonClass, inputClass } from "@/components/auth-card";
import { requireUser } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const user = await requireUser();
  if (user.familyId) redirect("/");
  const { erro } = await searchParams;

  return (
    <AuthCard title={`Olá, ${user.name}! Falta só um passo.`}>
      <form action={createFamilyAction} className="space-y-3">
        <p className="text-sm font-medium text-slate-700">Criar uma nova família</p>
        <input
          name="name"
          required
          placeholder="Nome da família (ex: Casa Silva)"
          className={inputClass}
        />
        <button type="submit" className={buttonClass}>
          Criar família
        </button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-slate-400">
        <div className="h-px flex-1 bg-slate-200" />
        ou
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <form action={acceptInviteAction} className="space-y-3">
        <p className="text-sm font-medium text-slate-700">Entrar numa família existente</p>
        <input name="token" required placeholder="Cole o link ou código do convite" className={inputClass} />
        {erro === "convite" && (
          <p className="text-sm text-red-600">Convite inválido ou expirado.</p>
        )}
        <button
          type="submit"
          className="w-full rounded-md border border-emerald-600 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
        >
          Usar convite
        </button>
      </form>
    </AuthCard>
  );
}
