"use client";

import { Field, inputClass, primaryButtonClass, selectClass } from "@/components/ui";
import {
  formatBRL,
  installmentPlan,
  parseAmountToCents,
  todayISO,
} from "@meusaldo/core/client";
import type { Category, CreditCard } from "@meusaldo/db";
import { useMemo, useState } from "react";

export function InstallmentForm({
  action,
  cards,
  categories,
  defaultCardId,
}: {
  action: (formData: FormData) => Promise<void>;
  cards: CreditCard[];
  categories: Category[];
  defaultCardId?: string;
}) {
  const [cardId, setCardId] = useState(defaultCardId ?? cards[0]?.id ?? "");
  const [total, setTotal] = useState("");
  const [installments, setInstallments] = useState(2);
  const [purchaseDate, setPurchaseDate] = useState(todayISO());

  const card = cards.find((c) => c.id === cardId);
  const preview = useMemo(() => {
    if (!card || !total) return null;
    try {
      return installmentPlan({
        totalCents: parseAmountToCents(total),
        installments,
        purchaseDate,
        closingDay: card.closingDay,
      });
    } catch {
      return null;
    }
  }, [card, total, installments, purchaseDate]);

  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Field label="Descrição">
          <input name="description" required placeholder="Ex: Notebook" className={inputClass} />
        </Field>
      </div>
      <Field label="Cartão">
        <select
          name="creditCardId"
          required
          value={cardId}
          onChange={(e) => setCardId(e.target.value)}
          className={selectClass}
        >
          {cards.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} (fecha dia {c.closingDay})
            </option>
          ))}
        </select>
      </Field>
      <Field label="Categoria">
        <select name="categoryId" className={selectClass}>
          <option value="">— sem categoria —</option>
          {categories
            .filter((c) => c.type === "expense")
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
        </select>
      </Field>
      <Field label="Valor total (R$)">
        <input
          name="total"
          required
          value={total}
          onChange={(e) => setTotal(e.target.value)}
          placeholder="1.200,00"
          className={inputClass}
        />
      </Field>
      <Field label="Número de parcelas">
        <input
          name="installments"
          type="number"
          min={1}
          max={60}
          required
          value={installments}
          onChange={(e) => setInstallments(Number(e.target.value))}
          className={inputClass}
        />
      </Field>
      <Field label="Data da compra">
        <input
          type="date"
          name="purchaseDate"
          value={purchaseDate}
          onChange={(e) => setPurchaseDate(e.target.value)}
          className={inputClass}
        />
      </Field>

      {preview && (
        <div className="sm:col-span-2">
          <p className="mb-1 text-xs font-medium text-slate-600 dark:text-slate-400">Prévia das parcelas</p>
          <ul className="max-h-48 divide-y divide-slate-100 dark:divide-slate-800 overflow-y-auto rounded-md border border-slate-200 dark:border-slate-700 text-sm">
            {preview.map((item) => (
              <li key={item.number} className="flex justify-between px-3 py-1.5">
                <span className="text-slate-600 dark:text-slate-400">
                  {item.number}/{preview.length} · fatura {item.cycle}
                </span>
                <span className="font-medium tabular-nums">{formatBRL(item.amountCents)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="sm:col-span-2">
        <button type="submit" className={primaryButtonClass}>
          Registrar compra parcelada
        </button>
      </div>
    </form>
  );
}
