import { Card, Field, inputClass, primaryButtonClass, selectClass } from "@/components/ui";
import type { BankAccount } from "@meusaldo/db";

export function AccountForm({
  action,
  account,
}: {
  action: (formData: FormData) => Promise<void>;
  account?: BankAccount;
}) {
  return (
    <Card className="max-w-md">
      <form action={action} className="space-y-4">
        {account && <input type="hidden" name="id" value={account.id} />}
        <Field label="Nome">
          <input
            name="name"
            required
            defaultValue={account?.name}
            placeholder="Ex: Nubank, Carteira"
            className={inputClass}
          />
        </Field>
        <Field label="Tipo">
          <select name="type" defaultValue={account?.type ?? "checking"} className={selectClass}>
            <option value="checking">Conta corrente</option>
            <option value="savings">Poupança</option>
            <option value="wallet">Carteira</option>
            <option value="investment">Investimento</option>
          </select>
        </Field>
        <Field label="Saldo inicial (R$)">
          <input
            name="initialBalance"
            defaultValue={account ? (account.initialBalanceCents / 100).toFixed(2).replace(".", ",") : ""}
            placeholder="0,00"
            className={inputClass}
          />
        </Field>
        <button type="submit" className={primaryButtonClass}>
          {account ? "Salvar" : "Criar conta"}
        </button>
      </form>
    </Card>
  );
}
