"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Plus, Search } from "lucide-react";
import { Button, buttonClasses } from "@/components/ui/button";
import { TransactionProvider, useTransactionUI } from "@/components/transactions/transaction-provider";
import { MAIN_NAV, isActivePath } from "@/constants/navigation";
import { useNotifications } from "@/hooks/use-notifications";
import { useLocalStorage } from "@/hooks/use-client-store";
import type { SessionUser } from "@/lib/auth/session";
import { cn } from "@/lib/utils/cn";
import { GlobalSearch } from "./global-search";
import { LogoMark } from "./logo";
import { NotificationBell } from "./notification-bell";
import { SessionProvider } from "./session-context";
import { Sidebar, SidebarContent } from "./sidebar";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

const COLLAPSE_KEY = "campuscoin_sidebar_collapsed";

function MobileDrawer({ open, onClose, unread }: { open: boolean; onClose: () => void; unread: number }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu điều hướng">
      <div className="absolute inset-0 animate-fade-in bg-overlay" onClick={onClose} aria-hidden />
      <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] animate-slide-in-left border-r border-border bg-surface">
        <SidebarContent onNavigate={onClose} unread={unread} />
      </div>
    </div>
  );
}

function MobileBottomNav() {
  const pathname = usePathname();
  const { openCreate } = useTransactionUI();
  const items = MAIN_NAV.filter((i) => i.mobile);
  const left = items.slice(0, 2);
  const right = items.slice(2, 4);

  const renderItem = (item: (typeof items)[number]) => {
    const active = isActivePath(pathname, item.href);
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cn("flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px]", active ? "text-primary" : "text-subtle")}
      >
        <Icon className="size-5" aria-hidden />
        {item.label}
      </Link>
    );
  };

  return (
    <nav
      aria-label="Điều hướng nhanh"
      className="fixed inset-x-0 bottom-0 z-30 flex items-center border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      {left.map(renderItem)}
      <div className="flex flex-1 justify-center">
        <button
          type="button"
          onClick={() => openCreate()}
          aria-label="Thêm giao dịch"
          className="-mt-5 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-pop transition-transform active:scale-95"
        >
          <Plus className="size-5" />
        </button>
      </div>
      {right.map(renderItem)}
    </nav>
  );
}

function Header({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { openCreate } = useTransactionUI();
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-border bg-background/85 px-4 backdrop-blur sm:gap-3 lg:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onOpenMenu} aria-label="Mở menu">
        <Menu />
      </Button>
      <Link href="/dashboard" className="lg:hidden" aria-label="Campus Coin">
        <LogoMark className="size-7" />
      </Link>
      <GlobalSearch className="hidden md:block" />
      <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
        <Link href="/transactions?search=1" className={buttonClasses("ghost", "icon", "md:hidden")} aria-label="Tìm giao dịch">
          <Search />
        </Link>
        <Button onClick={() => openCreate()} className="hidden sm:inline-flex">
          <Plus /> Thêm giao dịch
        </Button>
        <NotificationBell />
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}

function ShellFrame({ children }: { children: ReactNode }) {
  const [collapsedFlag, setCollapsedFlag] = useLocalStorage(COLLAPSE_KEY, "0");
  const collapsed = collapsedFlag === "1";
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { data: notifications } = useNotifications(1, 5);
  const unread = notifications?.unread ?? 0;

  const toggle = () => setCollapsedFlag(collapsed ? "0" : "1");

  return (
    <div className="flex min-h-dvh">
      <a href="#main" className="sr-only z-50 rounded-md bg-surface px-3 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2">
        Bỏ qua điều hướng
      </a>
      <Sidebar collapsed={collapsed} onToggle={toggle} unread={unread} />
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} unread={unread} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header onOpenMenu={() => setDrawerOpen(true)} />
        <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-4 pt-6 pb-28 sm:px-6 lg:px-8 lg:pb-10">
          {children}
        </main>
      </div>
      <MobileBottomNav />
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
