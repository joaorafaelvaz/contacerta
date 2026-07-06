"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Visão geral" },
  { href: "/lancamentos", label: "Lançamentos" },
  { href: "/contas", label: "Contas" },
  { href: "/cartoes", label: "Cartões" },
  { href: "/categorias", label: "Categorias" },
  { href: "/orcamentos", label: "Orçamentos" },
  { href: "/recorrencias", label: "Recorrências" },
  { href: "/familia", label: "Família" },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto md:flex-col md:gap-0.5">
      {LINKS.map((link) => {
        const active =
          link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium ${
              active
                ? "bg-emerald-600 text-white"
                : "text-slate-600 hover:bg-emerald-50 hover:text-emerald-800"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
