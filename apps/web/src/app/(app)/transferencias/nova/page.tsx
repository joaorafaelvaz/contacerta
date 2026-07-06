import { createTransferAction } from "@/actions/transactions";
import { Card, Field, PageHeader, inputClass, primaryButtonClass, selectClass } from "@/components/ui";
import { getAccounts } from "@/lib/data";
import { requireFamily } from "@/lib/session";
import { todayISO } from "@meusaldo/core";

export default async function NewTransferPage() {
  const user = await requireFamily();
  const accounts = await getAccounts(user.familyId);

  return (
    <>
      <PageHeader title="Nova transferência" />
      <Card className="max-w-md">
        <form action={createTransferAction} className="space-y-4">
          <Field label="Da conta">
            <select name="fromAccountId" required className={selectClass}>
              <option value="">Selecione...</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Para a conta">
            <select name="toAccountId" required className={selectClass}>
              <option value="">Selecione...</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Valor (R$)">
            <input name="amount" required placeholder="0,00" className={inputClass} />
          </Field>
          <Field label="Data">
            <input type="date" name="date" defaultValue={todayISO()} className={inputClass} />
          </Field>
          <Field label="Descrição (opcional)">
            <input name="description" placeholder="Transferência" className={inputClass} />
          </Field>
          <button type="submit" className={primaryButtonClass}>
            Transferir
          </button>
        </form>
      </Card>
    </>
  );
}
