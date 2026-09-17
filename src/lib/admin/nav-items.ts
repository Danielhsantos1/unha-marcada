import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Sparkles,
  Wallet,
  CircleDollarSign,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface AdminNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

export function adminNavItems(slug: string): AdminNavItem[] {
  const base = `/${slug}/admin`;
  return [
    { href: base, label: "Dashboard", icon: LayoutDashboard, exact: true },
    { href: `${base}/agenda`, label: "Agenda", icon: CalendarDays },
    { href: `${base}/clientes`, label: "Clientes", icon: Users },
    { href: `${base}/servicos`, label: "Serviços", icon: Sparkles },
    { href: `${base}/pagamentos`, label: "Pagamentos", icon: Wallet },
    { href: `${base}/contas-a-receber`, label: "Contas a Receber", icon: CircleDollarSign },
    { href: `${base}/relatorios`, label: "Relatórios", icon: BarChart3 },
    { href: `${base}/configuracoes`, label: "Configurações", icon: Settings },
  ];
}
