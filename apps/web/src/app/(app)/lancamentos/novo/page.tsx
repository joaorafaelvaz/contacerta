import { createTransactionAction } from "@/actions/transactions";
import { TransactionForm } from "@/components/transaction-form";
import { PageHeader } from "@/components/ui";
import { getAccounts, getCards, getCategories } from "@/lib/data";
import { requireFamily } from "@/lib/session";

export default async function NewTransactionPage() {
  const user = await requireFamily();
  const [accounts, cards, categories] = await Promise.all([
    getAccounts(user.familyId),
    getCards(user.familyId),
    getCategories(user.familyId),
  ]);

  return (
    <>
      <PageHeader title="Novo lançamento" />
      <TransactionForm
        action={createTransactionAction}
        accounts={accounts}
        cards={cards}
        categories={categories}
      />
    </>
  );
}
