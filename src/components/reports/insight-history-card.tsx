"use client";

import { useState } from "react";
import { Bookmark, BookmarkCheck, History } from "lucide-react";
import { EmptyState, ErrorState } from "@/components/common/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SkeletonRows } from "@/components/ui/skeleton";
import { useToast } from "@/context/ToastContext";
import { useInsightHistory, useTipMutations } from "@/hooks/use-tips";
import { monthLabel, renderInsight, renderTip } from "@/i18n/format";
import { useI18n } from "@/i18n/provider";

/** Lịch sử nhận định theo tháng (SRS 3.7) với đánh dấu để xem lại (SRS 3.10). */
export function InsightHistoryCard() {
  const { data, error, reload } = useInsightHistory();
  const { pinInsight } = useTipMutations();
  const { toast } = useToast();
  const { t, fmt } = useI18n();
  const l = t.reports.history;
  const [busy, setBusy] = useState<number | null>(null);

  const toggle = async (id: number, pinned: boolean) => {
    if (busy) return;
    setBusy(id);
    try {
      await pinInsight(id, !pinned);
    } catch (err) {
      toast.error(l.failed, fmt.error(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card>
      <CardHeader title={l.title} description={l.description} icon={<History />} />
      <CardContent>
        {error ? (
          <ErrorState onRetry={reload} />
        ) : !data ? (
          <SkeletonRows rows={3} />
        ) : data.length === 0 ? (
          <EmptyState compact icon={<History />} title={l.empty} />
        ) : (
          <ul className="space-y-3">
            {data.map((entry) => (
              <li key={entry.id} className="rounded-lg border border-border p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    {monthLabel(t, entry.month)}
                    {entry.pinned && <Badge tone="info">{l.bookmarked}</Badge>}
                  </p>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="size-10 sm:size-8"
                    disabled={busy === entry.id}
                    onClick={() => toggle(entry.id, entry.pinned)}
                    aria-label={entry.pinned ? l.unbookmark : l.bookmark}
                    title={entry.pinned ? l.unbookmark : l.bookmark}
                  >
                    {entry.pinned ? <BookmarkCheck /> : <Bookmark />}
                  </Button>
                </div>
                {entry.insights ? (
                  <ul className="mt-2 space-y-1.5">
                    {entry.insights.map((insight) => {
                      const text = renderInsight(t, insight);
                      return (
                        <li key={insight.id} className="text-[13px] text-muted">
                          <span className="font-medium text-foreground">{text.title}</span> – {text.description}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  entry.legacySummary && <p className="mt-2 text-[13px] leading-relaxed text-muted">{entry.legacySummary}</p>
                )}
                {entry.tips && entry.tips.length > 0 ? (
                  <div className="mt-3 border-t border-border pt-2">
                    <p className="mb-1 text-[12px] font-medium text-subtle">{l.tipsHeading}</p>
                    <ul className="space-y-1">
                      {entry.tips.map((tip) => (
                        <li key={tip.template} className="text-[13px] text-muted">
                          {renderTip(t, tip.template, tip.params).title}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  entry.legacyTip && <p className="mt-2 border-t border-border pt-2 text-[13px] text-muted">{entry.legacyTip}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
