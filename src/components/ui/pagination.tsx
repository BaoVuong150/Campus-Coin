import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./button";
import { formatNumber } from "@/lib/utils/money";

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, total, pageSize, onPageChange }: PaginationProps) {
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <nav aria-label="Phân trang" className="flex items-center justify-between gap-3 text-[13px] text-muted">
      <span className="tabular">
        {formatNumber(from)}–{formatNumber(to)} / {formatNumber(total)}
      </span>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon-sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1} aria-label="Trang trước">
          <ChevronLeft />
        </Button>
        <span className="tabular px-2 text-foreground" aria-current="page">
          {page} / {totalPages}
        </span>
        <Button variant="ghost" size="icon-sm" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} aria-label="Trang sau">
          <ChevronRight />
        </Button>
      </div>
    </nav>
  );
}
