"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CreditCardIcon,
  HomeIcon,
  ListIcon,
  PiggyBankIcon,
  RepeatIcon,
  TagIcon,
  UsersIcon,
  WalletIcon,
} from "./icons";

const LINKS = [
  { href: "/", label: "Visão geral", icon: HomeIcon },
  { href: "/lancamentos", label: "Lançamentos", icon: ListIcon },
  { href: "/contas", label: "Contas", icon: WalletIcon },
  { href: "/cartoes", label: "Cartões", icon: CreditCardIcon },
  { href: "/categorias", label: "Categorias", icon: TagIcon },
  { href: "/orcamentos", label: "Orçamentos", icon: PiggyBankIcon },
  { href: "/recorrencias", label: "Recorrências", icon: RepeatIcon },
  { href: "/familia", label: "Família", icon: UsersIcon },
];

export function Nav() {
  const pathname = usePathname();
  return (
    <nav className="scrollbar-none -mx-1 flex gap-1 overflow-x-auto px-1 pb-1 md:mx-0 md:flex-col md:gap-0.5 md:overflow-visible md:px-0 md:pb-0">
      {LINKS.map((link) => {
        const active =
          link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-800 dark:hover:text-emerald-300"
            }`}
          >
            <Icon className={`h-4 w-4 ${active ? "text-emerald-100" : "text-slate-400 dark:text-slate-500"}`} />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
