import {
  Bell,
  FolderCog,
  LayoutDashboard,
  PieChart,
  Receipt,
  Repeat,
  Settings,
  ShieldCheck,
  Target,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Hiển thị trên thanh điều hướng dưới cùng (mobile). */
  mobile?: boolean;
}

export const MAIN_NAV: NavItem[] = [
  { href: "/dashboard", label: "Tổng quan", icon: LayoutDashboard, mobile: true },
  { href: "/transactions", label: "Giao dịch", icon: Receipt, mobile: true },
  { href: "/budgets", label: "Ngân sách", icon: Wallet, mobile: true },
  { href: "/reports", label: "Báo cáo", icon: PieChart },
  { href: "/goals", label: "Mục tiêu", icon: Target, mobile: true },
  { href: "/recurring", label: "Định kỳ", icon: Repeat },
  { href: "/notifications", label: "Thông báo", icon: Bell },
];

export const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Admin Dashboard", icon: ShieldCheck },
  { href: "/admin/users", label: "Người dùng", icon: Users },
  { href: "/admin/system", label: "Hệ thống", icon: FolderCog },
];

export const FOOTER_NAV: NavItem[] = [{ href: "/settings", label: "Cài đặt", icon: Settings }];

export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}
