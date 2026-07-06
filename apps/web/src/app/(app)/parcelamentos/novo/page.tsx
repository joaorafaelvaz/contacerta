import { createInstallmentPurchaseAction } from "@/actions/installments";
import { InstallmentForm } from "@/components/installment-form";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { getCards, getCategories } from "@/lib/data";
import { requireFamily } from "@/lib/session";

export default async function NewInstallmentPage({
  searchParams,
}: {
  searchParams: Promise<{ cartao?: string }>;
}) {
  const user = await requireFamily();
  const { cartao } = await searchParams;
  const [cards, categories] = await Promise.all([
    getCards(user.familyId),
    getCategories(user.familyId),
  ]);

  return (
    <>
      <PageHeader title="Compra parcelada" />
      <Card className="max-w-lg">
        {cards.length === 0 ? (
          <EmptyState message="Cadastre um cartão de crédito primeiro." />
        ) : (
          <InstallmentForm
            action={createInstallmentPurchaseAction}
            cards={cards}
            categories={categories}
            defaultCardId={cartao}
          />
        )}
      </Card>
    </>
  );
}
