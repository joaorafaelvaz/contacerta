import { type CreditCard, type Db, schema } from "@meusaldo/db";
import type { ISODate } from "../dates";
import { installmentPlan } from "../installments";

/** Registra a compra parcelada e as N transações filhas, uma por fatura. */
export async function createInstallmentPurchase(
  db: Db,
  input: {
    familyId: string;
    card: CreditCard;
    description: string;
    totalCents: number;
    installments: number;
    purchaseDate: ISODate;
    categoryId?: string | null;
    userId?: string;
  },
): Promise<{ purchaseId: string }> {
  const plan = installmentPlan({
    totalCents: input.totalCents,
    installments: input.installments,
    purchaseDate: input.purchaseDate,
    closingDay: input.card.closingDay,
  });

  return db.transaction(async (tx) => {
    const [purchase] = await tx
      .insert(schema.installmentPurchases)
      .values({
        familyId: input.familyId,
        description: input.description,
        totalAmountCents: input.totalCents,
        installments: input.installments,
        creditCardId: input.card.id,
        categoryId: input.categoryId ?? null,
        purchaseDate: input.purchaseDate,
      })
      .returning({ id: schema.installmentPurchases.id });
    if (!purchase) throw new Error("Falha ao registrar compra parcelada");

    await tx.insert(schema.transactions).values(
      plan.map((item) => ({
        familyId: input.familyId,
        description: `${input.description} (${item.number}/${input.installments})`,
        amountCents: item.amountCents,
        type: "expense" as const,
        status: "pending" as const,
        date: item.date,
        creditCardId: input.card.id,
        categoryId: input.categoryId ?? null,
        installmentPurchaseId: purchase.id,
        installmentNumber: item.number,
        createdBy: input.userId ?? null,
      })),
    );

    return { purchaseId: purchase.id };
  });
}
