"use server";

import { getString } from "@/lib/forms";
import { assertFamilyOwns } from "@/lib/guards";
import { requireFamily } from "@/lib/session";
import { db, schema } from "@meusaldo/db";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createCategoryAction(formData: FormData) {
  const user = await requireFamily();
  const type = getString(formData, "type");
  if (type !== "income" && type !== "expense") throw new Error("Tipo inválido");
  await db.insert(schema.categories).values({
    familyId: user.familyId,
    name: getString(formData, "name"),
    type,
  });
  revalidatePath("/categorias");
}

export async function deleteCategoryAction(formData: FormData) {
  const user = await requireFamily();
  const id = getString(formData, "id");
  await assertFamilyOwns(schema.categories, id, user.familyId);
  await db.delete(schema.categories).where(eq(schema.categories.id, id));
  revalidatePath("/categorias");
}
