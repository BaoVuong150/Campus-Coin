import type { PointReason } from "@/i18n/templates";
import type { AchievementId, LevelInfo } from "@/lib/finance/points";

export interface PointsSummaryDTO {
  total: number;
  level: LevelInfo;
  streak: { current: number; best: number };
  achievements: { id: AchievementId; unlocked: boolean }[];
  history: { id: number; reason: PointReason; points: number; createdAt: string }[];
  values: Record<PointReason, number>;
}
