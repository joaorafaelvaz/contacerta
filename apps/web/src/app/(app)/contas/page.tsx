import { archiveAccountAction } from "@/actions/accounts";
import { ConfirmButton } from "@/components/confirm-button";
import { Money } from "@/components/money";
import { Card, EmptyState, PageHeader, dangerButtonClass } from "@/components/ui";
import { requireFamily } from "@/lib/session";
import { getAccountsWithBalances } from "@meusaldo/core";
import { db } from "@meusaldo/db";
import Link from "next/link";

const TYPE_LABELS: Record<string, string> = {
  checking: "Conta corrente",
  savings: "Poupança",
  wallet: "Carteira",
  investment: "Investimento",
};

export default async function AccountsPage() {
  const user = await requireFamily();
  const accounts = await getAccountsWithBalances(db, user.familyId);

  return (
    <>
      <PageHeader title="Contas" action={{ href: "/contas/nova", label: "Nova conta" }} />
      <Card>
        {accounts.length === 0 ? (
          <EmptyState message="Nenhuma conta cadastrada. Crie a primeira para começar." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {accounts.map((acc) => (
              <li key={acc.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <Link
                    href={`/contas/${acc.id}/editar`}
                    className="font-medium text-slate-800 hover:text-emerald-700"
                  >
                    {acc.name}
                  </Link>
                  <p className="text-xs text-slate-400">{TYPE_LABELS[acc.type] ?? acc.type}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Money cents={acc.balanceCents} signed className="font-semibold" />
                  <form action={archiveAccountAction}>
                    <input type="hidden" name="id" value={acc.id} />
                    <ConfirmButton
                      message={`Arquivar a conta "${acc.name}"? Os lançamentos são mantidos.`}
                      className={dangerButtonClass}
                    >
                      Arquivar
                    </ConfirmButton>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
