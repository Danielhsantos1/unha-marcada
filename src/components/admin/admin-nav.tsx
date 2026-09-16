"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Sparkles,
  Wallet,
  BarChart3,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

function navItems(slug: string) {
  const base = `/${slug}/admin`;
  return [
    { href: base, label: "Dashboard", icon: LayoutDashboard, exact: true },
    { href: `${base}/agenda`, label: "Agenda", icon: CalendarDays },
    { href: `${base}/clientes`, label: "Clientes", icon: Users },
    { href: `${base}/servicos`, label: "Serviços", icon: Sparkles },
    { href: `${base}/pagamentos`, label: "Pagamentos", icon: Wallet },
    { href: `${base}/relatorios`, label: "Relatórios", icon: BarChart3 },
    { href: `${base}/configuracoes`, label: "Configurações", icon: Settings },
  ];
}

export function AdminNav({ slug, className }: { slug: string; className?: string }) {
  const pathname = usePathname();

  return (
    <nav className={className}>
      {navItems(slug).map(({ href, label, icon: Icon, exact }) => {
        const isActive = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-rose-50 text-rose-700"
                : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900",
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
