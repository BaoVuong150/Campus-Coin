"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Plus, Search } from "lucide-react";
import { AssistantWidget } from "@/components/assistant/assistant-widget";
import { Button, buttonClasses } from "@/components/ui/button";
import { TransactionProvider, useTransactionUI } from "@/components/transactions/transaction-provider";
import { ADMIN_NAV, FOOTER_NAV, isActivePath, MAIN_NAV, type NavItem } from "@/constants/navigation";
import { FINANCE_KEYS, invalidate } from "@/hooks/use-api";
import { useLocalStorage } from "@/hooks/use-client-store";
import { useNotifications } from "@/hooks/use-notifications";
import { useI18n } from "@/i18n/provider";
import { apiFetch } from "@/lib/api-client";
import type { SessionUser } from "@/lib/auth/session";
import { cn } from "@/lib/utils/cn";
import { Breadcrumbs } from "./breadcrumbs";
import { GlobalSearch } from "./global-search";
import { LanguageToggle } from "./language-switcher";
import { LogoMark } from "./logo";
import { NotificationBell } from "./notification-bell";
import { SessionProvider, useSessionUser } from "./session-context";
import { Sidebar, SidebarContent } from "./sidebar";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

/*
 * Khung app theo kích thước (một nguồn điều hướng MAIN_NAV cho mọi tầng):
 *   < 768      header mobile (logo + tên trang + menu) + thanh điều hướng dưới
 *   768–1279   rail chỉ icon (64px → 76px từ 1024) + header đầy đủ
 *   ≥ 1280     sidebar 248px (người dùng có thể thu gọn thành rail)
 */

const COLLAPSE_KEY = "campuscoin_sidebar_collapsed";

/** Các mục cố định trên thanh điều hướng dưới (mobile); mọi mục còn lại nằm trong menu ở header. */
const BOTTOM_NAV_HREFS = ["/dashboard", "/transactions", "/budgets", "/goals"];

function MobileDrawer({ open, onClose, unread }: { open: boolean; onClose: () => void; unread: number }) {
  const { t } = useI18n();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label={t.nav.menu}>
      <div className="absolute inset-0 animate-fade-in bg-overlay" onClick={onClose} aria-hidden />
      <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] animate-slide-in-left flex-col border-r border-border bg-surface pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        <div className="min-h-0 flex-1">
          <SidebarContent mode="full" onNavigate={onClose} unread={unread} />
        </div>
        {/* Header mobile không có chỗ cho ngôn ngữ/giao diện nên đặt ở cuối menu. */}
        <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-3">
          <LanguageToggle />
          <ThemeToggle className="size-11" />
        </div>
      </div>
    </div>
  );
}

/** Thanh điều hướng dưới (< 768px): Tổng quan · Giao dịch · [+] · Ngân sách · Mục tiêu. Cao 64px + safe-area iPhone. */
function MobileBottomNav() {
  const pathname = usePathname();
  const { openCreate } = useTransactionUI();
  const { t } = useI18n();
  const items = BOTTOM_NAV_HREFS.map((href) => MAIN_NAV.find((i) => i.href === href)).filter((i): i is NavItem => !!i);

  const tabClass = (active: boolean) =>
    cn(
      "flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-1 text-[12px] leading-none transition-colors",
      active ? "font-medium text-primary-ink" : "text-subtle"
    );

  const renderItem = (item: NavItem) => {
    const active = isActivePath(pathname, item.href);
    const Icon = item.icon;
    return (
      <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={tabClass(active)}>
        <Icon className="size-5" aria-hidden />
        <span className="max-w-full truncate px-0.5">{t.nav[item.labelKey]}</span>
      </Link>
    );
  };

  return (
    <nav
      aria-label={t.nav.quickNav}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
    >
      <div className="flex h-(--mobile-nav-height) items-stretch px-1">
        {items.slice(0, 2).map(renderItem)}
        <div className="flex flex-1 items-center justify-center">
          <button
            type="button"
            onClick={() => openCreate()}
            aria-label={t.header.addTransaction}
            className="flex size-13 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-pop transition-transform active:scale-95"
          >
            <Plus className="size-6" />
          </button>
        </div>
        {items.slice(2).map(renderItem)}
      </div>
    </nav>
  );
}

/** Tên trang hiện tại cho header mobile – lấy từ cùng định nghĩa điều hướng, không lặp dữ liệu. */
function useCurrentPageTitle(): string {
  const pathname = usePathname();
  const { t } = useI18n();
  const item = [...ADMIN_NAV, ...MAIN_NAV, ...FOOTER_NAV].find((i) => isActivePath(pathname, i.href));
  return item ? t.nav[item.labelKey] : "Campus Coin";
}

function Header({ onOpenMenu, menuOpen }: { onOpenMenu: () => void; menuOpen: boolean }) {
  const { openCreate } = useTransactionUI();
  const { t } = useI18n();
  const title = useCurrentPageTitle();
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/85 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="flex h-(--app-header-height) items-center gap-2 px-(--app-gutter) sm:gap-3">
        <Link href="/dashboard" className="flex min-w-0 items-center gap-2.5 md:hidden" aria-label={t.brand.overviewLink}>
          <LogoMark className="size-8 shrink-0" />
          <span className="truncate text-[17px] font-semibold tracking-tight text-foreground">{title}</span>
        </Link>
        <GlobalSearch className="hidden md:block" />
        <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1">
          <Link href="/transactions?search=1" className={buttonClasses("ghost", "icon", "size-11 md:hidden")} aria-label={t.header.searchLabel}>
            <Search />
          </Link>
          {/* Mobile đã có nút + ở thanh điều hướng dưới. */}
          <Button onClick={() => openCreate()} className="mr-1 hidden md:inline-flex">
            <Plus /> {t.header.addTransaction}
          </Button>
          <NotificationBell />
          <LanguageToggle className="hidden md:inline-flex" />
          <ThemeToggle className="hidden md:inline-flex" />
          <UserMenu />
          {/* Mobile: báo cáo, định kỳ, điểm, thông báo, cài đặt… nằm trong menu này. */}
          <Button variant="ghost" size="icon" className="size-11 md:hidden" onClick={onOpenMenu} aria-label={t.nav.openMenu} aria-expanded={menuOpen} aria-haspopup="dialog">
            <Menu />
          </Button>
        </div>
      </div>
    </header>
  );
}

/**
 * Mở app → POST /api/sync một lần (sinh giao dịch định kỳ đến hạn, cộng điểm kỳ đã qua).
 * Có dữ liệu mới thì làm mới các màn hình tài chính đang hiển thị.
 */
function useBackgroundSync() {
  useEffect(() => {
    apiFetch<{ created: number; awarded: number }>("/api/sync", { method: "POST" })
      .then((r) => {
        if (r.created > 0 || r.awarded > 0) invalidate(...FINANCE_KEYS);
      })
      .catch(() => {
        // Không chặn giao diện: lần mở app sau (hoặc cron) sẽ đồng bộ lại.
      });
  }, []);
}

function ShellFrame({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const user = useSessionUser();
  useBackgroundSync();
  const [collapsedFlag, setCollapsedFlag] = useLocalStorage(COLLAPSE_KEY, "0");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { data: notifications } = useNotifications(1, 5);
  const collapsed = collapsedFlag === "1";
  const unread = notifications?.unread ?? 0;

  return (
    <div className="flex min-h-dvh">
      <a href="#main" className="sr-only z-50 rounded-md bg-surface px-3 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2">
        {t.nav.skipToContent}
      </a>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsedFlag(collapsed ? "0" : "1")} unread={unread} />
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} unread={unread} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header onOpenMenu={() => setDrawerOpen(true)} menuOpen={drawerOpen} />
        {/* Chừa chỗ cho thanh điều hướng dưới (mobile), safe-area và nút trợ lý để nội dung cuối trang không bị che. */}
        <main id="main" className="app-page flex-1 pt-5 pb-[calc(var(--mobile-nav-height)_+_env(safe-area-inset-bottom)_+_76px)] md:pt-6 md:pb-24 xl:pt-8">
          <Breadcrumbs />
          {children}
        </main>
      </div>
      <MobileBottomNav />
      {/* Trợ lý hỗ trợ chỉ dành cho sinh viên (trả lời bằng dữ liệu tài chính cá nhân). */}
      {user.role === "student" && <AssistantWidget />}
    </div>
  );
}

export function AppShell({ user, children }: { user: SessionUser; children: ReactNode }) {
  return (
    <SessionProvider user={user}>
      <TransactionProvider>
        <ShellFrame>{children}</ShellFrame>
      </TransactionProvider>
    </SessionProvider>
  );
}
