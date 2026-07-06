import { createCardAction } from "@/actions/cards";
import { CardForm } from "@/components/card-form";
import { PageHeader } from "@/components/ui";
import { getAccounts } from "@/lib/data";
import { requireFamily } from "@/lib/session";

export default async function NewCardPage() {
  const user = await requireFamily();
  const accounts = await getAccounts(user.familyId);
  return (
    <>
      <PageHeader title="Novo cartão" />
      <CardForm action={createCardAction} accounts={accounts} />
    </>
  );
}
