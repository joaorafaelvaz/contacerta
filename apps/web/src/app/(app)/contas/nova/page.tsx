import { createAccountAction } from "@/actions/accounts";
import { AccountForm } from "@/components/account-form";
import { PageHeader } from "@/components/ui";
import { requireFamily } from "@/lib/session";

export default async function NewAccountPage() {
  await requireFamily();
  return (
    <>
      <PageHeader title="Nova conta" />
      <AccountForm action={createAccountAction} />
    </>
  );
}
