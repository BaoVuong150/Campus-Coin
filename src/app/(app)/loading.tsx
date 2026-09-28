import { Card } from "@/components/ui/card";
import { Skeleton, SkeletonCard, SkeletonChart } from "@/components/ui/skeleton";
import { getServerMessages } from "@/i18n/server";

/**
 * Khung chờ trong app: giữ nguyên sidebar/header, phần nội dung là skeleton cùng bố cục với dashboard
 * (tiêu đề → 4 thẻ số liệu → biểu đồ + thẻ bên) để trang hiện ra không bị "nhảy".
 */
export default async function AppLoading() {
  const t = await getServerMessages();
  return (
    <div role="status" aria-live="polite" className="animate-fade-in [animation-delay:120ms] [animation-fill-mode:both]">
      <span className="sr-only">{t.common.loadingPage}</span>

      <div className="mb-6 space-y-2.5" aria-hidden>
        <Skeleton className="h-8 w-60 max-w-full" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4" aria-hidden>
        {Array.from({ length: 4 }, (_, i) => (
          <SkeletonCard key={i} className={i === 0 || i === 3 ? "col-span-2 sm:col-span-1" : undefined} />
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3 xl:mt-5 xl:gap-5" aria-hidden>
        <Card className="p-5 lg:col-span-2">
          <Skeleton className="mb-5 h-4 w-40" />
          <SkeletonChart className="h-56" />
        </Card>
        <SkeletonCard lines={5} />
      </div>
    </div>
  );
}
