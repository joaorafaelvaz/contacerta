"use server";

import { requireFamily, requireUser } from "@/lib/session";
import { acceptInvite, createFamilyForUser, createInvite } from "@meusaldo/core";
import { db } from "@meusaldo/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createFamilyAction(formData: FormData) {
  const user = await requireUser();
  if (user.familyId) redirect("/");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Informe o nome da família");
  await createFamilyForUser(db, { name, userId: user.id });
  redirect("/");
}

export async function acceptInviteAction(formData: FormData) {
  const user = await requireUser();
  const raw = String(formData.get("token") ?? "").trim();
  // aceita o token puro ou o link completo /convite/<token>
  const token = raw.split("/").filter(Boolean).pop() ?? "";
  const result = token ? await acceptInvite(db, { token, userId: user.id }) : null;
  if (!result) redirect("/onboarding?erro=convite");
  redirect("/");
}

export async function createInviteAction() {
  const user = await requireFamily();
  const { token } = await createInvite(db, { familyId: user.familyId, userId: user.id });
  revalidatePath("/familia");
  redirect(`/familia?token=${token}`);
}
