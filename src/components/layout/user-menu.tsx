"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { LogOut, Settings, ShieldCheck } from "lucide-react";
import { useDismiss } from "@/hooks/use-dismiss";
import { useI18n } from "@/i18n/provider";
import { apiFetch } from "@/lib/api-client";
import { useSessionUser } from "./session-context";

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export function Avatar({ name, className = "size-8 text-[12px]" }: { name: string; className?: string }) {
  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-full bg-primary-soft font-semibold text-primary ${className}`} aria-hidden>
      {initials(name)}
    </span>
  );
}

export async function logout() {
  try {
    await apiFetch("/api/auth/logout", { method: "POST", skipAuthRedirect: true });
  } finally {
    window.location.replace("/login");
  }
}

export function UserMenu() {
  const user = useSessionUser();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);

  const itemClass = "flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm text-foreground hover:bg-surface-hover";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t.header.openAccountMenu}
        className="flex items-center rounded-full ring-offset-2 ring-offset-background transition-shadow hover:ring-2 hover:ring-border"
      >
        <Avatar name={user.name} />
      </button>
      {open && (
        <div role="menu" className="absolute top-full right-0 z-40 mt-2 w-60 animate-scale-in rounded-lg border border-border bg-surface p-1.5 shadow-pop">
          <div className="px-2.5 py-2">
            <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
            <p className="truncate text-[12px] text-muted">{user.email}</p>
          </div>
          <div className="my-1 border-t border-border" />
          <Link role="menuitem" href="/settings" onClick={close} className={itemClass}>
            <Settings className="size-4 text-subtle" aria-hidden /> {t.nav.settings}
          </Link>
          {user.role === "admin" && (
            <Link role="menuitem" href="/admin" onClick={close} className={itemClass}>
              <ShieldCheck className="size-4 text-subtle" aria-hidden /> {t.header.admin}
            </Link>
          )}
          <button
            role="menuitem"
            type="button"
            onClick={() => void logout()}
            className="flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-sm text-danger hover:bg-danger-soft"
          >
            <LogOut className="size-4" aria-hidden /> {t.header.logout}
          </button>
        </div>
      )}
    </div>
  );
}
