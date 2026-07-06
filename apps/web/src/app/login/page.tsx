"use client";

import { AuthCard, buttonClass, inputClass } from "@/components/auth-card";
import { signIn } from "@/lib/auth-client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const { error } = await signIn.email({
      email: String(form.get("email")),
      password: String(form.get("password")),
    });
    setLoading(false);
    if (error) {
      setError("E-mail ou senha inválidos");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <AuthCard title="Entre na sua conta">
      <form onSubmit={handleSubmit} className="space-y-3">
        <input name="email" type="email" required placeholder="E-mail" className={inputClass} />
        <input
          name="password"
          type="password"
          required
          placeholder="Senha"
          className={inputClass}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading} className={buttonClass}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-500">
        Não tem conta?{" "}
        <Link href="/register" className="font-medium text-emerald-700 hover:underline">
          Criar conta
        </Link>
      </p>
    </AuthCard>
  );
}
