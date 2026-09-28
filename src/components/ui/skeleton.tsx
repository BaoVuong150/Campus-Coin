import type React from "react";
import { cn } from "@/lib/utils/cn";
import { Card } from "./card";

export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={cn("animate-pulse rounded-md bg-surface-secondary", className)} style={style} aria-hidden />;
}

export function SkeletonCard({ lines = 2, className }: { lines?: number; className?: string }) {
  return (
    <Card className={cn("space-y-3 p-5", className)} aria-busy>
      <Skeleton className="h-3.5 w-24" />
      <Skeleton className="h-7 w-36" />
      {Array.from({ length: Math.max(0, lines - 1) }, (_, i) => (
        <Skeleton key={i} className="h-3 w-28" />
      ))}
    </Card>
  );
}

export function SkeletonChart({ className }: { className?: string }) {
  return (
    <div className={cn("flex h-64 items-end gap-2 px-2", className)} aria-hidden>
      {[45, 70, 55, 85, 40, 65, 75, 50, 60, 80, 35, 55].map((h, i) => (
        <Skeleton key={i} className="flex-1 rounded-b-none" style={{ height: `${h}%` }} />
      ))}
    </div>
  );
}

export function SkeletonRows({ rows = 5 }: { rows?: number }) {
  return (
    <div className="divide-y divide-border" aria-hidden>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 py-3">
          <Skeleton className="size-9 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-2/5" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}
