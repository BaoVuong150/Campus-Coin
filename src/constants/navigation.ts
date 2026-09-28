import {
  Award,
  Bell,
  FolderCog,
  LayoutDashboard,
  PieChart,
  Receipt,
  Repeat,
  Settings,
  ShieldCheck,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { Messages } from "@/i18n";

export interface NavItem {
  href: string;
  labelKey: keyof Messages["nav"];
  icon: LucideIcon;
}

export const MAIN_NAV: NavItem[] = [
  { href: "/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/transactions", labelKey: "transactions", icon: Receipt },
  { href: "/budgets", labelKey: "budgets", icon: Wallet },
  { href: "/reports", labelKey: "reports", icon: PieChart },
  // Mục tiêu tạm thời tháo khỏi menu điều hướng: { href: "/goals", labelKey: "goals", icon: Target } (import Target từ lucide-react khi bật lại).
  { href: "/recurring", labelKey: "recurring", icon: Repeat },
  { href: "/points", labelKey: "points", icon: Award },
  { href: "/notifications", labelKey: "notifications", icon: Bell },
];

export const ADMIN_NAV: NavItem[] = [
  { href: "/admin", labelKey: "adminDashboard", icon: ShieldCheck },
  { href: "/admin/users", labelKey: "adminUsers", icon: Users },
  { href: "/admin/system", labelKey: "adminSystem", icon: FolderCog },
];

export const FOOTER_NAV: NavItem[] = [{ href: "/settings", labelKey: "settings", icon: Settings }];

export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}
