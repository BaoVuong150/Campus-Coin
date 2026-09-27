"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { ADMIN_NAV, FOOTER_NAV, isActivePath, MAIN_NAV, type NavItem } from "@/constants/navigation";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils/cn";
import { Logo } from "./logo";
import { useSessionUser } from "./session-context";

interface NavListProps {
  items: NavItem[];
  collapsed?: boolean;
  onNavigate?: () => void;
  badges?: Record<string, number>;
}

function NavList({ items, collapsed, onNavigate, badges }: NavListProps) {
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
              title={collapsed ? label : undefined}
              className={cn(
                "group relative flex h-9 items-center gap-3 rounded-md px-2.5 text-sm transition-colors duration-150",
                collapsed && "justify-center px-0",
                active ? "bg-primary-soft font-medium text-foreground" : "text-muted hover:bg-surface-hover hover:text-foreground"
              )}
            >
              {active && <span className="absolute top-2 bottom-2 left-0 w-0.5 rounded-full bg-primary" aria-hidden />}
              <Icon className={cn("size-4 shrink-0", active ? "text-primary" : "text-subtle group-hover:text-foreground")} aria-hidden />
              {!collapsed && <span className="truncate">{label}</span>}
              {!!badge && (
                <span
                  className={cn(
                    "tabular rounded-full bg-danger px-1.5 text-[10px] leading-4 font-semibold text-danger-foreground",
                    collapsed ? "absolute top-1 right-1" : "ml-auto"
                  )}
                >
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
  collapsed?: boolean;
  onNavigate?: () => void;
  unread?: number;
}

export function SidebarContent({ collapsed, onNavigate, unread }: SidebarContentProps) {
  const user = useSessionUser();
  const { t } = useI18n();
  const badges = { "/notifications": unread ?? 0 };
  return (
    <nav aria-label={t.nav.mainNav} className="flex h-full flex-col gap-6 px-3 py-4">
      <Link href="/dashboard" onClick={onNavigate} className={cn("px-1.5", collapsed && "flex justify-center px-0")} aria-label={t.brand.overviewLink}>
        <Logo collapsed={collapsed} />
      </Link>

      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto scrollbar-thin">
        <NavList items={MAIN_NAV} collapsed={collapsed} onNavigate={onNavigate} badges={badges} />
        {user.role === "admin" && (
          <div>
            {!collapsed && <p className="mb-1.5 px-2.5 text-[11px] font-medium tracking-wide text-subtle uppercase">{t.nav.adminSection}</p>}
            <NavList items={ADMIN_NAV} collapsed={collapsed} onNavigate={onNavigate} />
          </div>
        )}
      </div>

      <NavList items={FOOTER_NAV} collapsed={collapsed} onNavigate={onNavigate} />
    </nav>
  );
}

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  unread?: number;
}

export function Sidebar({ collapsed, onToggle, unread }: SidebarProps) {
  const { t } = useI18n();
  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-border bg-surface transition-[width] duration-200 lg:flex",
        collapsed ? "w-17" : "w-60"
      )}
    >
      <SidebarContent collapsed={collapsed} unread={unread} />
      <button
        type="button"
        onClick={onToggle}
        aria-label={collapsed ? t.nav.expandSidebar : t.nav.collapseSidebar}
        aria-expanded={!collapsed}
        className="mx-3 mb-3 flex h-8 items-center justify-center gap-2 rounded-md text-[12px] text-subtle transition-colors hover:bg-surface-hover hover:text-foreground"
      >
        {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
        {!collapsed && t.nav.collapse}
      </button>
    </aside>
  );
}
