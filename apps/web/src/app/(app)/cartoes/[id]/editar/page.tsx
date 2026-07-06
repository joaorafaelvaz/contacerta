import { archiveCardAction, updateCardAction } from "@/actions/cards";
import { CardForm } from "@/components/card-form";
import { ConfirmButton } from "@/components/confirm-button";
import { PageHeader, dangerButtonClass } from "@/components/ui";
import { getAccounts } from "@/lib/data";
import { requireFamily } from "@/lib/session";
import { db, schema } from "@meusaldo/db";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

export default async function EditCardPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireFamily();
  const { id } = await params;
  const [card] = await db
    .select()
    .from(schema.creditCards)
    .where(and(eq(schema.creditCards.id, id), eq(schema.creditCards.familyId, user.familyId)));
  if (!card) notFound();
  const accounts = await getAccounts(user.familyId);

  return (
    <>
      <PageHeader title={`Editar cartão: ${card.name}`} />
      <CardForm action={updateCardAction} card={card} accounts={accounts} />
      <form action={archiveCardAction} className="mt-4">
        <input type="hidden" name="id" value={card.id} />
        <ConfirmButton
          message={`Arquivar o cartão "${card.name}"? Os lançamentos são mantidos.`}
          className={dangerButtonClass}
        >
          Arquivar cartão
        </ConfirmButton>
      </form>
    </>
  );
}
