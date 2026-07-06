import { Money } from "@/components/money";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { formatDateBR } from "@/lib/format";
import { getCards } from "@/lib/data";
import { requireFamily } from "@/lib/session";
import { getInvoice, invoiceCycleForDate, todayISO } from "@meusaldo/core";
import { db } from "@meusaldo/db";
import Link from "next/link";

export default async function CardsPage() {
  const user = await requireFamily();
  const cards = await getCards(user.familyId);
  const today = todayISO();

  const withInvoices = await Promise.all(
    cards.map(async (card) => ({
      card,
      invoice: await getInvoice(db, card, invoiceCycleForDate(card.closingDay, today)),
    })),
  );

  return (
    <>
      <PageHeader title="Cartões de crédito" action={{ href: "/cartoes/novo", label: "Novo cartão" }} />
      {withInvoices.length === 0 ? (
        <Card>
          <EmptyState message="Nenhum cartão cadastrado." />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {withInvoices.map(({ card, invoice }) => (
            <Card key={card.id}>
              <div className="flex items-start justify-between">
                <div>
                  <Link
                    href={`/cartoes/${card.id}`}
                    className="font-semibold text-slate-800 hover:text-emerald-700"
                  >
                    {card.name}
                  </Link>
                  <p className="text-xs text-slate-400">
                    Fecha dia {card.closingDay} · vence dia {card.dueDay}
                  </p>
                </div>
                <Link
                  href={`/cartoes/${card.id}/editar`}
                  className="text-xs text-slate-400 hover:text-emerald-700"
                >
                  Editar
                </Link>
              </div>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className="text-xs text-slate-500">Fatura atual ({invoice.cycle})</p>
                  <Money cents={invoice.totalCents} className="text-lg font-bold" />
                </div>
                <p className="text-xs text-slate-400">vence {formatDateBR(invoice.dueDate)}</p>
              </div>
              <div className="mt-3 flex gap-2">
                <Link href={`/cartoes/${card.id}`} className="text-sm font-medium text-emerald-700 hover:underline">
                  Ver fatura
                </Link>
                <span className="text-slate-300">·</span>
                <Link
                  href={`/parcelamentos/novo?cartao=${card.id}`}
                  className="text-sm font-medium text-emerald-700 hover:underline"
                >
                  Compra parcelada
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
