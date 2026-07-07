"use client";

import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function SignOutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await signOut();
        router.push("/login");
        router.refresh();
      }}
      className="text-xs text-slate-400 dark:text-slate-500 hover:text-red-600"
    >
      Sair
    </button>
  );
}
