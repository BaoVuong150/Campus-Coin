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
import { useApi } from "./use-api";

export const useSummary = (month: string) => useApi<SummaryDTO>(`/api/analytics/summary?month=${month}`);
export const usePlanning = () => useApi<PlanningDTO>("/api/planning");
export const useCashFlow = (range: CashFlowPreset) => useApi<CashFlowPoint[]>(`/api/analytics/cash-flow?range=${range}`);
export const useCategoryBreakdown = (month: string) =>
  useApi<CategoryBreakdownItem[]>(`/api/analytics/categories?month=${month}`);
export const useInsights = () => useApi<FinancialInsight[]>("/api/analytics/insights");
export const useReport = (period: ReportPeriod, anchor: string) =>
  useApi<ReportDTO>(`/api/reports?period=${period}&anchor=${anchor}`);
