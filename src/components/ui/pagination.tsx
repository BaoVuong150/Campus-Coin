"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./button";
import { formatNumber } from "@/lib/utils/money";
import { useI18n } from "@/i18n/provider";

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, total, pageSize, onPageChange }: PaginationProps) {
  const { t } = useI18n();
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <nav aria-label={t.common.pagination} className="flex items-center justify-between gap-3 text-[13px] text-muted">
      <span className="tabular">
        {formatNumber(from)}–{formatNumber(to)} / {formatNumber(total)}
      </span>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon-sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1} aria-label={t.common.prevPage}>
          <ChevronLeft />
        </Button>
        <span className="tabular px-2 text-foreground" aria-current="page">
          {page} / {totalPages}
        </span>
        <Button variant="ghost" size="icon-sm" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} aria-label={t.common.nextPage}>
          <ChevronRight />
        </Button>
      </div>
    </nav>
  );
}
