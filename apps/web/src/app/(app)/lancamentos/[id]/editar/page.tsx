import { updateTransactionAction } from "@/actions/transactions";
import { TransactionForm } from "@/components/transaction-form";
import { PageHeader } from "@/components/ui";
import { getAccounts, getCards, getCategories } from "@/lib/data";
import { requireFamily } from "@/lib/session";
import { db, schema } from "@meusaldo/db";
import { and, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";

export default async function EditTransactionPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireFamily();
  const { id } = await params;
  const [txn] = await db
    .select()
    .from(schema.transactions)
    .where(and(eq(schema.transactions.id, id), eq(schema.transactions.familyId, user.familyId)));
  if (!txn) notFound();
  // transferências não são editáveis (par de lançamentos); exclua e recrie
  if (txn.transferGroupId) redirect("/lancamentos");

  const [accounts, cards, categories] = await Promise.all([
    getAccounts(user.familyId),
    getCards(user.familyId),
    getCategories(user.familyId),
  ]);

  return (
    <>
      <PageHeader title="Editar lançamento" />
      {txn.installmentPurchaseId && (
        <p className="mb-3 rounded-md bg-amber-50 dark:bg-amber-950/50 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
          Este lançamento é a parcela {txn.installmentNumber} de uma compra parcelada — a edição
          afeta só esta parcela.
        </p>
      )}
      <TransactionForm
        action={updateTransactionAction}
        transaction={txn}
        accounts={accounts}
        cards={cards}
        categories={categories}
      />
    </>
  );
}
