import { SkeletonCard } from "@/components/ui/skeleton";

export default function AppLoading() {
  return (
    <div className="space-y-6" aria-busy aria-label="Đang tải">
      <div className="h-8 w-56 animate-pulse rounded-md bg-surface-secondary" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      <SkeletonCard lines={4} />
    </div>
  );
}
