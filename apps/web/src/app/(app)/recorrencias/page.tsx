import {
  createRecurringRuleAction,
  deleteRecurringRuleAction,
  toggleRecurringRuleAction,
} from "@/actions/recurring";
import { ConfirmButton } from "@/components/confirm-button";
import { Money } from "@/components/money";
import { Card, EmptyState, Field, PageHeader, dangerButtonClass, inputClass, primaryButtonClass, selectClass } from "@/components/ui";
import { getAccounts, getCards, getCategories } from "@/lib/data";
import { requireFamily } from "@/lib/session";
import { db, schema } from "@meusaldo/db";
import { asc, eq } from "drizzle-orm";

export default async function RecurringPage() {
  const user = await requireFamily();
  const [rules, accounts, cards, categories] = await Promise.all([
    db
      .select()
      .from(schema.recurringRules)
      .where(eq(schema.recurringRules.familyId, user.familyId))
      .orderBy(asc(schema.recurringRules.dayOfMonth)),
    getAccounts(user.familyId),
    getCards(user.familyId),
    getCategories(user.familyId),
  ]);

  const accountName = new Map(accounts.map((a) => [a.id, a.name]));
  const cardName = new Map(cards.map((c) => [c.id, c.name]));

  return (
    <>
      <PageHeader title="Lançamentos recorrentes" />

      <Card title="Nova recorrência" className="mb-4">
        <form action={createRecurringRuleAction} className="grid gap-3 sm:grid-cols-2">
          <Field label="Descrição">
            <input name="description" required placeholder="Ex: Aluguel, Salário" className={inputClass} />
          </Field>
          <Field label="Valor (R$)">
            <input name="amount" required placeholder="1.500,00" className={inputClass} />
          </Field>
          <Field label="Tipo">
            <select name="type" className={selectClass}>
              <option value="expense">Despesa</option>
              <option value="income">Receita</option>
            </select>
          </Field>
          <Field label="Dia do mês">
            <input name="dayOfMonth" type="number" min={1} max={31} required className={inputClass} />
          </Field>
          <Field label="Conta / cartão">
            <select name="source" required className={selectClass}>
              <option value="">Selecione...</option>
              <optgroup label="Contas">
                {accounts.map((acc) => (
                  <option key={acc.id} value={`acc:${acc.id}`}>
                    {acc.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Cartões">
                {cards.map((card) => (
                  <option key={card.id} value={`card:${card.id}`}>
                    {card.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </Field>
          <Field label="Categoria">
            <select name="categoryId" className={selectClass}>
              <option value="">— sem categoria —</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({cat.type === "income" ? "receita" : "despesa"})
                </option>
              ))}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <button type="submit" className={primaryButtonClass}>
              Criar recorrência
            </button>
          </div>
        </form>
      </Card>

      <Card title="Regras cadastradas">
        {rules.length === 0 ? (
          <EmptyState message="Nenhuma recorrência cadastrada." />
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {rules.map((rule) => (
              <li key={rule.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className={`text-sm font-medium ${rule.active ? "text-slate-800 dark:text-slate-200" : "text-slate-400 dark:text-slate-500 line-through"}`}>
                    {rule.description}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Todo dia {rule.dayOfMonth} ·{" "}
                    {rule.accountId ? accountName.get(rule.accountId) : cardName.get(rule.creditCardId ?? "")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Money
                    cents={rule.type === "income" ? rule.amountCents : -rule.amountCents}
                    signed
                    className="text-sm font-semibold"
                  />
                  <form action={toggleRecurringRuleAction}>
                    <input type="hidden" name="id" value={rule.id} />
                    <button type="submit" className="text-xs text-slate-500 dark:text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-400">
                      {rule.active ? "Pausar" : "Ativar"}
                    </button>
                  </form>
                  <form action={deleteRecurringRuleAction}>
                    <input type="hidden" name="id" value={rule.id} />
                    <ConfirmButton
                      message={`Excluir a recorrência "${rule.description}"?`}
                      className={dangerButtonClass}
                    >
                      Excluir
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
