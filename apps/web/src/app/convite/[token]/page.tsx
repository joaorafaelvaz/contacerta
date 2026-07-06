import { acceptInviteAction } from "@/actions/family";
import { AuthCard, buttonClass } from "@/components/auth-card";
import { requireUser } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const user = await requireUser();
  if (user.familyId) redirect("/");

  return (
    <AuthCard title="Você recebeu um convite de família">
      <form action={acceptInviteAction}>
        <input type="hidden" name="token" value={token} />
        <button type="submit" className={buttonClass}>
          Aceitar convite
        </button>
      </form>
    </AuthCard>
  );
}
