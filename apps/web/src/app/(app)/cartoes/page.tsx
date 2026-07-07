import { CreditCardIcon } from "@/components/icons";
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
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                    <CreditCardIcon className="h-5 w-5" />
                  </span>
                  <div>
                    <Link
                      href={`/cartoes/${card.id}`}
                      className="font-semibold text-slate-800 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-400"
                    >
                      {card.name}
                    </Link>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Fecha dia {card.closingDay} · vence dia {card.dueDay}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/cartoes/${card.id}/editar`}
                  className="text-xs text-slate-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400"
                >
                  Editar
                </Link>
              </div>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Fatura atual ({invoice.cycle})</p>
                  <Money cents={invoice.totalCents} className="text-lg font-bold" />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">vence {formatDateBR(invoice.dueDate)}</p>
              </div>
              {card.limitCents > 0 && (
                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>Limite usado</span>
                    <span>
                      <Money cents={invoice.pendingTotalCents} /> / <Money cents={card.limitCents} />
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className={`h-full rounded-full ${
                        invoice.pendingTotalCents > card.limitCents * 0.8
                          ? "bg-red-500"
                          : "bg-emerald-500"
                      }`}
                      style={{
                        width: `${Math.min(100, Math.round((invoice.pendingTotalCents / card.limitCents) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              )}
              <div className="mt-3 flex gap-2">
                <Link href={`/cartoes/${card.id}`} className="text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:underline">
                  Ver fatura
                </Link>
                <span className="text-slate-300 dark:text-slate-600">·</span>
                <Link
                  href={`/parcelamentos/novo?cartao=${card.id}`}
                  className="text-sm font-medium text-emerald-700 dark:text-emerald-400 hover:underline"
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
