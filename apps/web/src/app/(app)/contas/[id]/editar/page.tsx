import { updateAccountAction } from "@/actions/accounts";
import { AccountForm } from "@/components/account-form";
import { PageHeader } from "@/components/ui";
import { requireFamily } from "@/lib/session";
import { db, schema } from "@meusaldo/db";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

export default async function EditAccountPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireFamily();
  const { id } = await params;
  const [account] = await db
    .select()
    .from(schema.bankAccounts)
    .where(and(eq(schema.bankAccounts.id, id), eq(schema.bankAccounts.familyId, user.familyId)));
  if (!account) notFound();

  return (
    <>
      <PageHeader title={`Editar conta: ${account.name}`} />
      <AccountForm action={updateAccountAction} account={account} />
    </>
  );
}
