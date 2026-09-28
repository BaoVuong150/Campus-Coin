"use client";

import { useState } from "react";
import { Lightbulb, Pin, PinOff, X } from "lucide-react";
import { EmptyState, ErrorState } from "@/components/common/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SkeletonRows } from "@/components/ui/skeleton";
import { useToast } from "@/context/ToastContext";
import { useSavingTips, useTipMutations, type TipAction } from "@/hooks/use-tips";
import { renderTip } from "@/i18n/format";
import { useI18n } from "@/i18n/provider";
import { formatVND } from "@/lib/utils/money";
import type { SavingTipDTO } from "@/types/finance";

/** Mẹo tiết kiệm cá nhân hóa (SRS 3.8): xếp theo số tiền có thể tiết kiệm, ghim hoặc bỏ qua từng mẹo. */
export function SavingTipsCard() {
  const { data, error, reload } = useSavingTips();
  const { setTip } = useTipMutations();
  const { toast } = useToast();
  const { t, fmt } = useI18n();
  const l = t.dashboard.tips;
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const act = async (key: string, action: TipAction) => {
    if (busyKey) return;
    setBusyKey(key);
    try {
      await setTip(key, action);
    } catch (err) {
      toast.error(l.failed, fmt.error(err));
    } finally {
      setBusyKey(null);
    }
  };

  const text = (tip: SavingTipDTO) => (tip.source === "personal" ? renderTip(t, tip.template, tip.params) : { title: tip.title, description: tip.content });

  return (
    <Card className="min-w-0">
      <CardHeader title={l.title} description={l.description} icon={<Lightbulb />} />
      <CardContent className="pt-2">
        {error ? (
          <ErrorState onRetry={reload} />
        ) : !data ? (
          <SkeletonRows rows={3} />
        ) : data.items.length === 0 ? (
          <EmptyState compact icon={<Lightbulb />} title={l.empty} />
        ) : (
          <ul className="divide-y divide-border">
            {data.items.map((tip) => {
              const { title, description } = text(tip);
              return (
                <li key={tip.key} className="flex gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-foreground">
                      {title}
                      {tip.pinned && <Badge tone="info">{l.pinned}</Badge>}
                      {tip.source === "system" && <Badge tone="neutral">{l.system}</Badge>}
                    </p>
                    <p className="mt-1 text-[13px] leading-relaxed text-muted">{description}</p>
                    {tip.potentialSaving ? (
                      <p className="mt-1.5 text-[12px] font-medium text-success">{l.potential(formatVND(tip.potentialSaving))}</p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="size-10 sm:size-8"
                      disabled={busyKey === tip.key}
                      onClick={() => act(tip.key, tip.pinned ? "unpin" : "pin")}
                      aria-label={tip.pinned ? l.unpin : l.pin}
                      title={tip.pinned ? l.unpin : l.pin}
                    >
                      {tip.pinned ? <PinOff /> : <Pin />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="size-10 sm:size-8"
                      disabled={busyKey === tip.key}
                      onClick={() => act(tip.key, "dismiss")}
                      aria-label={l.dismiss}
                      title={l.dismiss}
                    >
                      <X />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
