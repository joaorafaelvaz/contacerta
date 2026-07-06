import { Card, Field, inputClass, primaryButtonClass, selectClass } from "@/components/ui";
import type { BankAccount, CreditCard } from "@meusaldo/db";

export function CardForm({
  action,
  card,
  accounts,
}: {
  action: (formData: FormData) => Promise<void>;
  card?: CreditCard;
  accounts: BankAccount[];
}) {
  return (
    <Card className="max-w-md">
      <form action={action} className="space-y-4">
        {card && <input type="hidden" name="id" value={card.id} />}
        <Field label="Nome">
          <input
            name="name"
            required
            defaultValue={card?.name}
            placeholder="Ex: Nubank, Itaú Click"
            className={inputClass}
          />
        </Field>
        <Field label="Limite (R$)">
          <input
            name="limit"
            required
            defaultValue={card ? (card.limitCents / 100).toFixed(2).replace(".", ",") : ""}
            placeholder="5.000,00"
            className={inputClass}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Dia de fechamento">
            <input
              name="closingDay"
              type="number"
              min={1}
              max={31}
              required
              defaultValue={card?.closingDay}
              className={inputClass}
            />
          </Field>
          <Field label="Dia de vencimento">
            <input
              name="dueDay"
              type="number"
              min={1}
              max={31}
              required
              defaultValue={card?.dueDay}
              className={inputClass}
            />
          </Field>
        </div>
        <Field label="Conta de pagamento padrão">
          <select
            name="paymentAccountId"
            defaultValue={card?.paymentAccountId ?? ""}
            className={selectClass}
          >
            <option value="">— nenhuma —</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}
          </select>
        </Field>
        <button type="submit" className={primaryButtonClass}>
          {card ? "Salvar" : "Criar cartão"}
        </button>
      </form>
    </Card>
  );
}
