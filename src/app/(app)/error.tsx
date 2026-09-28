"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/i18n/provider";

/** Lỗi không mong đợi trong ứng dụng: hiển thị thông báo thân thiện, không lộ chi tiết kỹ thuật. */
export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useI18n();
  return (
    <Card className="mx-auto mt-10 max-w-md p-8 text-center">
      <AlertCircle className="mx-auto size-6 text-danger" aria-hidden />
      <h1 className="mt-3 text-lg font-semibold text-foreground">{t.common.unexpectedTitle}</h1>
      <p className="mt-1 text-sm text-muted">{t.common.unexpectedBody}</p>
      <Button className="mt-5" onClick={reset}>
        <RefreshCw /> {t.common.retry}
      </Button>
    </Card>
  );
}
