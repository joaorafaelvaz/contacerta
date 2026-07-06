import { Card, Field, inputClass, primaryButtonClass, selectClass } from "@/components/ui";
import { todayISO } from "@meusaldo/core";
import type { BankAccount, Category, CreditCard, Transaction } from "@meusaldo/db";

export function TransactionForm({
  action,
  transaction,
  accounts,
  cards,
  categories,
  returnTo,
}: {
  action: (formData: FormData) => Promise<void>;
  transaction?: Transaction;
  accounts: BankAccount[];
  cards: CreditCard[];
  categories: Category[];
  returnTo?: string;
}) {
  const source = transaction?.accountId
    ? `acc:${transaction.accountId}`
    : transaction?.creditCardId
      ? `card:${transaction.creditCardId}`
      : "";

  return (
    <Card className="max-w-lg">
      <form action={action} className="grid gap-3 sm:grid-cols-2">
        {transaction && <input type="hidden" name="id" value={transaction.id} />}
        {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
        <Field label="Tipo">
          <select name="type" defaultValue={transaction?.type ?? "expense"} className={selectClass}>
            <option value="expense">Despesa</option>
            <option value="income">Receita</option>
          </select>
        </Field>
        <Field label="Valor (R$)">
          <input
            name="amount"
            required
            defaultValue={
              transaction ? (transaction.amountCents / 100).toFixed(2).replace(".", ",") : ""
            }
            placeholder="0,00"
            className={inputClass}
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Descrição">
            <input
              name="description"
              required
              defaultValue={transaction?.description}
              placeholder="Ex: Mercado, Conta de luz"
              className={inputClass}
            />
          </Field>
        </div>
        <Field label="Data">
          <input
            type="date"
            name="date"
            defaultValue={transaction?.date ?? todayISO()}
            className={inputClass}
          />
        </Field>
        <Field label="Conta / cartão">
          <select name="source" required defaultValue={source} className={selectClass}>
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
          <select name="categoryId" defaultValue={transaction?.categoryId ?? ""} className={selectClass}>
            <option value="">— sem categoria —</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name} ({cat.type === "income" ? "receita" : "despesa"})
              </option>
            ))}
          </select>
        </Field>
        <Field label="Situação (só p/ conta; cartão é sempre pendente até a fatura)">
          <select name="status" defaultValue={transaction?.status ?? "paid"} className={selectClass}>
            <option value="paid">Pago / recebido</option>
            <option value="pending">Pendente (conta a pagar)</option>
          </select>
        </Field>
        <Field label="Vencimento (se pendente)">
          <input
            type="date"
            name="dueDate"
            defaultValue={transaction?.dueDate ?? ""}
            className={inputClass}
          />
        </Field>
        <div className="sm:col-span-2">
          <button type="submit" className={primaryButtonClass}>
            {transaction ? "Salvar" : "Lançar"}
          </button>
        </div>
      </form>
    </Card>
  );
}
