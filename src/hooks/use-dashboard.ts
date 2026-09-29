"use client";

import type { CashFlowPreset } from "@/lib/utils/date";
import type {
  CashFlowPoint,
  CategoryBreakdownItem,
  FinancialInsight,
  PlanningDTO,
  ReportDTO,
  ReportPeriod,
  SummaryDTO,
} from "@/types/finance";
import { useApi, buildQuery } from "./use-api";

export const useSummary = (month: string) => useApi<SummaryDTO>(`/api/analytics/summary?month=${month}`);
export const usePlanning = () => useApi<PlanningDTO>("/api/planning");
export const useCashFlow = (range: CashFlowPreset) => useApi<CashFlowPoint[]>(`/api/analytics/cash-flow?range=${range}`);
export const useCategoryBreakdown = (month: string) =>
  useApi<CategoryBreakdownItem[]>(`/api/analytics/categories?month=${month}`);
export const useInsights = () => useApi<FinancialInsight[]>("/api/analytics/insights");
export interface ReportFilters {
  categoryId?: number | null;
  from?: string;
  to?: string;
}

export const useReport = (period: ReportPeriod, anchor: string, filters: ReportFilters = {}) =>
  useApi<ReportDTO>(
    `/api/reports${buildQuery({ period, anchor, category_id: filters.categoryId ?? undefined, from: filters.from, to: filters.to })}`
  );
