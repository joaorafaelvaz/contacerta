"use client";

import { AuthCard, buttonClass, inputClass } from "@/components/auth-card";
import { signUp } from "@/lib/auth-client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const { error } = await signUp.email({
      name: String(form.get("name")),
      email: String(form.get("email")),
      password: String(form.get("password")),
    });
    setLoading(false);
    if (error) {
      setError(error.message ?? "Não foi possível criar a conta");
      return;
    }
    router.push("/onboarding");
    router.refresh();
  }

  return (
    <AuthCard title="Crie sua conta">
      <form onSubmit={handleSubmit} className="space-y-3">
        <input name="name" required placeholder="Seu nome" className={inputClass} />
        <input name="email" type="email" required placeholder="E-mail" className={inputClass} />
        <input
          name="password"
          type="password"
          required
          minLength={8}
          placeholder="Senha (mín. 8 caracteres)"
          className={inputClass}
        />
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <button type="submit" disabled={loading} className={buttonClass}>
          {loading ? "Criando..." : "Criar conta"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium text-emerald-700 dark:text-emerald-400 hover:underline">
          Entrar
        </Link>
      </p>
    </AuthCard>
  );
}
