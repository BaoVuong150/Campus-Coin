"use client";

import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { StatusScreen } from "@/components/common/status-screen";
import { Button, buttonClasses } from "@/components/ui/button";
import { useI18n } from "@/i18n/provider";

/**
 * Lỗi không mong đợi ở các trang công khai (landing, đăng nhập…). Trang trong app có error boundary riêng
 * nằm trong khung app. Không hiển thị chi tiết kỹ thuật cho người dùng.
 */
export default function PublicError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useI18n();
  const c = t.common;
  const action = "w-full min-[480px]:w-auto";
  return (
    <StatusScreen
      code="500"
      eyebrow={c.errorCode}
      title={c.unexpectedTitle}
      description={c.unexpectedBody}
      homeLabel={t.brand.home}
      actions={
        <>
          <Button size="lg" onClick={reset} className={action}>
            <RefreshCw /> {c.retry}
          </Button>
          <Link href="/" className={buttonClasses("outline", "lg", action)}>
            {c.backHome}
          </Link>
        </>
      }
    />
  );
}
