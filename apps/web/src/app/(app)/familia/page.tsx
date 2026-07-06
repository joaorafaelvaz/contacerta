import { createInviteAction } from "@/actions/family";
import { Card, PageHeader, primaryButtonClass } from "@/components/ui";
import { requireFamily } from "@/lib/session";
import { db, schema } from "@meusaldo/db";
import { asc, eq } from "drizzle-orm";

export default async function FamilyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const user = await requireFamily();
  const { token } = await searchParams;

  const [[family], members] = await Promise.all([
    db.select().from(schema.families).where(eq(schema.families.id, user.familyId)),
    db
      .select({ id: schema.users.id, name: schema.users.name, email: schema.users.email })
      .from(schema.users)
      .where(eq(schema.users.familyId, user.familyId))
      .orderBy(asc(schema.users.createdAt)),
  ]);

  const baseUrl = process.env.BETTER_AUTH_URL ?? "";
  const inviteLink = token ? `${baseUrl}/convite/${token}` : null;

  return (
    <>
      <PageHeader title={`Família: ${family?.name ?? ""}`} />

      <Card title="Membros" className="mb-4">
        <ul className="divide-y divide-slate-100">
          {members.map((member) => (
            <li key={member.id} className="flex items-center justify-between py-2">
              <span className="text-sm font-medium text-slate-800">
                {member.name}
                {member.id === user.id && <span className="ml-1 text-xs text-slate-400">(você)</span>}
              </span>
              <span className="text-xs text-slate-400">{member.email}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card title="Convidar membro">
        <p className="mb-3 text-sm text-slate-500">
          Gere um link de convite e envie para quem vai compartilhar as finanças com você. O link
          vale por 7 dias.
        </p>
        <form action={createInviteAction}>
          <button type="submit" className={primaryButtonClass}>
            Gerar link de convite
          </button>
        </form>
        {inviteLink && (
          <div className="mt-3 rounded-md bg-emerald-50 p-3">
            <p className="mb-1 text-xs font-medium text-emerald-800">Convite gerado — copie e envie:</p>
            <code className="break-all text-sm text-emerald-900">{inviteLink}</code>
          </div>
        )}
      </Card>
    </>
  );
}
