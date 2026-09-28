"use client";

import type { PointsSummaryDTO } from "@/types/points";
import { useApi } from "./use-api";

export type { PointsSummaryDTO };

export function usePoints() {
  return useApi<PointsSummaryDTO>("/api/points");
}
