import { createCategoryAction, deleteCategoryAction } from "@/actions/categories";
import { ConfirmButton } from "@/components/confirm-button";
import { Card, EmptyState, PageHeader, dangerButtonClass, inputClass, primaryButtonClass, selectClass } from "@/components/ui";
import { getCategories } from "@/lib/data";
import { requireFamily } from "@/lib/session";

export default async function CategoriesPage() {
  const user = await requireFamily();
  const categories = await getCategories(user.familyId);
  const income = categories.filter((c) => c.type === "income");
  const expense = categories.filter((c) => c.type === "expense");

  return (
    <>
      <PageHeader title="Categorias" />

      <Card title="Nova categoria" className="mb-4">
        <form action={createCategoryAction} className="flex flex-wrap items-end gap-3">
          <input name="name" required placeholder="Nome" className={`${inputClass} max-w-60`} />
          <select name="type" className={`${selectClass} max-w-40`}>
            <option value="expense">Despesa</option>
            <option value="income">Receita</option>
          </select>
          <button type="submit" className={primaryButtonClass}>
            Adicionar
          </button>
        </form>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {[
          { title: "Despesas", items: expense },
          { title: "Receitas", items: income },
        ].map(({ title, items }) => (
          <Card key={title} title={title}>
            {items.length === 0 ? (
              <EmptyState message="Nenhuma categoria." />
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((cat) => (
                  <li key={cat.id} className="flex items-center justify-between py-2">
                    <span className="text-sm text-slate-800 dark:text-slate-200">{cat.name}</span>
                    <form action={deleteCategoryAction}>
                      <input type="hidden" name="id" value={cat.id} />
                      <ConfirmButton
                        message={`Excluir a categoria "${cat.name}"? Lançamentos existentes ficam sem categoria.`}
                        className={dangerButtonClass}
                      >
                        Excluir
                      </ConfirmButton>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        ))}
      </div>
    </>
  );
}
