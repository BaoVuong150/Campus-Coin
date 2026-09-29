"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { ADMIN_NAV, FOOTER_NAV, isActivePath, MAIN_NAV, type NavItem } from "@/constants/navigation";
import { useI18n } from "@/i18n/provider";

/**
 * Breadcrumbs (SRS – điều hướng rõ ràng giữa các khu vực): dựng từ cùng định nghĩa menu, không lặp dữ liệu.
 *   /budgets      → Tổng quan › Ngân sách
 *   /admin/users  → Quản trị › Người dùng
 * Trang gốc (Tổng quan, Tổng quan quản trị) không cần breadcrumb.
 */
export function Breadcrumbs() {
  const pathname = usePathname();
  const { t } = useI18n();
  const admin = pathname.startsWith("/admin");
  const root: NavItem = admin ? ADMIN_NAV[0] : MAIN_NAV[0];
  const current = [...(admin ? ADMIN_NAV.slice(1) : MAIN_NAV.slice(1)), ...FOOTER_NAV].find((i) => isActivePath(pathname, i.href));
  if (!current) return null;

  return (
    <nav aria-label={t.nav.breadcrumb} className="mb-3">
      <ol className="flex min-w-0 items-center gap-1 text-[13px] text-muted">
        <li>
          <Link href={root.href} className="rounded-sm transition-colors hover:text-foreground">
            {t.nav[root.labelKey]}
          </Link>
        </li>
        <li aria-hidden>
          <ChevronRight className="size-3.5 text-subtle" />
        </li>
        <li className="min-w-0 truncate font-medium text-foreground" aria-current="page">
          {t.nav[current.labelKey]}
        </li>
      </ol>
    </nav>
  );
}
