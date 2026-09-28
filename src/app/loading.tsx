import { LogoMark } from "@/components/layout/logo";
import { Spinner } from "@/components/ui/spinner";
import { getServerMessages } from "@/i18n/server";

/**
 * Màn hình tải toàn trang (landing, đăng nhập, và lúc khung app đang xác thực phiên).
 * Hiện sau 150ms để điều hướng nhanh không bị nháy loader.
 */
export default async function Loading() {
  const t = await getServerMessages();
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-dvh animate-fade-in flex-col items-center justify-center gap-5 bg-background [animation-delay:150ms] [animation-fill-mode:both]"
    >
      <div className="relative flex size-16 items-center justify-center">
        <Spinner className="absolute inset-0 size-16 text-brand" />
        <LogoMark className="size-9" />
      </div>
      <p className="text-sm text-muted">{t.common.loadingPage}</p>
    </div>
  );
}
