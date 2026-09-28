"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { ADMIN_NAV, FOOTER_NAV, isActivePath, MAIN_NAV, type NavItem } from "@/constants/navigation";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils/cn";
import { Logo } from "./logo";
import { useSessionUser } from "./session-context";

/**
 * Cách hiển thị điều hướng (dùng chung một nguồn MAIN_NAV cho mọi kích thước):
 * - full: đủ icon + chữ (drawer trên mobile).
 * - responsive: rail chỉ icon ở tablet/laptop (768–1279), tự mở rộng đủ chữ từ 1280px. Chỉ bằng CSS → không nháy khi hydrate.
 * - rail: luôn chỉ icon (người dùng chủ động thu gọn trên desktop).
 */
export type SidebarMode = "full" | "responsive" | "rail";

const LABEL: Record<SidebarMode, string> = { full: "truncate", responsive: "hidden truncate xl:inline", rail: "hidden" };
const LINK_LAYOUT: Record<SidebarMode, string> = {
  full: "px-2.5",
  responsive: "justify-center px-0 xl:justify-start xl:px-2.5",
  rail: "justify-center px-0",
};
const BADGE: Record<SidebarMode, string> = {
  full: "ml-auto",
  responsive: "absolute top-1 right-1 xl:static xl:ml-auto",
  rail: "absolute top-1 right-1",
};
const SECTION_TITLE: Record<SidebarMode, string> = { full: "block", responsive: "hidden xl:block", rail: "hidden" };

interface NavListProps {
  items: NavItem[];
  mode: SidebarMode;
  onNavigate?: () => void;
  badges?: Record<string, number>;
}

function NavList({ items, mode, onNavigate, badges }: NavListProps) {
  const pathname = usePathname();
  const { t } = useI18n();
  return (
    <ul className="space-y-0.5">
      {items.map((item) => {
        const active = isActivePath(pathname, item.href);
        const badge = badges?.[item.href];
        const label = t.nav[item.labelKey];
        const Icon = item.icon;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              aria-label={mode === "full" ? undefined : label}
              title={mode === "full" ? undefined : label}
              className={cn(
                "group relative flex items-center gap-3 rounded-md text-sm transition-colors duration-150",
                mode === "full" ? "h-11" : "h-10 xl:h-9",
                LINK_LAYOUT[mode],
                active ? "bg-primary-soft font-medium text-foreground" : "text-muted hover:bg-surface-hover hover:text-foreground"
              )}
            >
              {active && <span className="absolute top-2 bottom-2 left-0 w-0.5 rounded-full bg-primary-ink" aria-hidden />}
              <Icon className={cn("size-4 shrink-0", active ? "text-primary-ink" : "text-subtle group-hover:text-foreground")} aria-hidden />
              <span className={LABEL[mode]}>{label}</span>
              {!!badge && (
                <span className={cn("tabular rounded-full bg-danger px-1.5 text-[10px] leading-4 font-semibold text-danger-foreground", BADGE[mode])}>
                  {badge > 99 ? "99+" : badge}
                  <span className="sr-only"> {t.nav.unread}</span>
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

interface SidebarContentProps {
  mode?: SidebarMode;
  onNavigate?: () => void;
  unread?: number;
}

export function SidebarContent({ mode = "full", onNavigate, unread }: SidebarContentProps) {
  const user = useSessionUser();
  const { t } = useI18n();
  const badges = { "/notifications": unread ?? 0 };
  const compactLogo = mode === "rail" ? "flex justify-center px-0" : mode === "responsive" ? "flex justify-center px-0 xl:block xl:px-1.5" : "px-1.5";
  return (
    <nav aria-label={t.nav.mainNav} className="flex h-full flex-col gap-6 px-3 py-4">
      <Link href="/dashboard" onClick={onNavigate} className={compactLogo} aria-label={t.brand.overviewLink}>
        <Logo collapsed={mode === "rail"} labelClassName={mode === "responsive" ? "hidden xl:inline" : undefined} />
      </Link>

      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto scrollbar-thin">
        <NavList items={MAIN_NAV} mode={mode} onNavigate={onNavigate} badges={badges} />
        {user.role === "admin" && (
          <div>
            <p className={cn("mb-1.5 px-2.5 text-[11px] font-medium tracking-wide text-subtle uppercase", SECTION_TITLE[mode])}>{t.nav.adminSection}</p>
            <NavList items={ADMIN_NAV} mode={mode} onNavigate={onNavigate} />
          </div>
        )}
      </div>

      <NavList items={FOOTER_NAV} mode={mode} onNavigate={onNavigate} />
    </nav>
  );
}

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  unread?: number;
}

/**
 * Sidebar cố định từ 768px: rail 64px (tablet) → 76px (laptop) → 248px đầy đủ (≥ 1280, trừ khi người dùng thu gọn).
 * Dưới 768px không có sidebar: dùng header + thanh điều hướng dưới (xem AppShell).
 */
export function Sidebar({ collapsed, onToggle, unread }: SidebarProps) {
  const { t } = useI18n();
  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-dvh w-(--sidebar-rail) shrink-0 flex-col border-r border-border bg-surface transition-[width] duration-200 md:flex",
        !collapsed && "xl:w-(--sidebar-wide)"
      )}
    >
      <SidebarContent mode={collapsed ? "rail" : "responsive"} unread={unread} />
      {/* Nút thu gọn chỉ có ý nghĩa khi sidebar có thể mở rộng (≥ 1280). */}
      <button
        type="button"
        onClick={onToggle}
        aria-label={collapsed ? t.nav.expandSidebar : t.nav.collapseSidebar}
        aria-expanded={!collapsed}
        className="mx-3 mb-3 hidden h-8 items-center justify-center gap-2 rounded-md text-[12px] text-subtle transition-colors hover:bg-surface-hover hover:text-foreground xl:flex"
      >
        {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
        {!collapsed && t.nav.collapse}
      </button>
    </aside>
  );
}
