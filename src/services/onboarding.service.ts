import { prisma } from "@/lib/database/prisma";
import { allowanceRecurringId, isOnboarded, withOnboarding } from "@/lib/auth/account-flags";
import { CANONICAL_CATEGORY_NAMES, normalizeText } from "@/lib/finance/categorize";
import { nextPayDate } from "@/lib/finance/onboarding";
import { currentMonthKey, ymdToStorageDate } from "@/lib/utils/date";
import type { OnboardingInput } from "@/lib/validations/onboarding.schema";
import { upsertBudget } from "./budget.service";
import { createRecurring } from "./recurring.service";
import { toNumber } from "./mappers";

/** Tên khoản thu định kỳ do onboarding tạo (người dùng có thể đổi tên ở trang Định kỳ). */
const ALLOWANCE_NAME = "Trợ cấp hằng tháng";

export interface OnboardingState {
  completed: boolean;
  monthlyAllowance: number;
  payDay: number;
  monthlySavingsGoal: number;
}

export async function getOnboardingState(userId: string): Promise<OnboardingState> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { preferences: true, monthly_allowance_baseline: true, salary_pay_day: true, monthly_savings_goal: true },
  });
  return {
    completed: isOnboarded(user.preferences),
    monthlyAllowance: toNumber(user.monthly_allowance_baseline),
    payDay: user.salary_pay_day ?? 5,
    monthlySavingsGoal: toNumber(user.monthly_savings_goal),
  };
}

/** Danh mục thu "Trợ cấp gia đình" của hệ thống (dự phòng: danh mục thu mặc định bất kỳ). */
async function allowanceCategoryId(): Promise<number | null> {
  const incomes = await prisma.category.findMany({ where: { user_id: null, type: "income" }, select: { id: true, name: true } });
  const match = incomes.find((c) => normalizeText(c.name) === CANONICAL_CATEGORY_NAMES.allowance);
  return (match ?? incomes[0])?.id ?? null;
}

/**
 * Hoàn tất thiết lập ban đầu: lưu thu nhập/ngày nhận/mục tiêu tiết kiệm, (tùy chọn) tạo khoản thu định kỳ
 * vào ngày nhận – bắt đầu từ lần nhận KẾ TIẾP để không tự ghi một khoản tiền chưa nhận – và các ngân sách khởi đầu.
 */
export async function completeOnboarding(userId: string, input: OnboardingInput): Promise<void> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { preferences: true } });
  if (input.skip) {
    await prisma.user.update({ where: { id: userId }, data: { preferences: withOnboarding(user.preferences, null) } });
    return;
  }

  // Ngân sách: getUsableCategory trong upsertBudget chặn danh mục thu / danh mục của người khác.
  const month = currentMonthKey();
  for (const budget of input.budgets) {
    await upsertBudget(userId, { category_id: budget.category_id, month, limit_amount: budget.limit_amount });
  }

  let recurringId = allowanceRecurringId(user.preferences);
  if (input.auto_allowance && input.monthly_allowance > 0 && !recurringId) {
    const categoryId = await allowanceCategoryId();
    if (categoryId) {
      const recurring = await createRecurring(userId, {
        name: ALLOWANCE_NAME,
        amount: input.monthly_allowance,
        type: "income",
        category_id: categoryId,
        frequency: "monthly",
        start_date: nextPayDate(input.pay_day),
        is_fixed: true,
      });
      recurringId = recurring.id;
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      monthly_allowance_baseline: input.monthly_allowance,
      salary_pay_day: input.pay_day,
      monthly_savings_goal: input.monthly_savings_goal,
      preferences: withOnboarding(user.preferences, recurringId),
    },
  });
}

/**
 * Đồng bộ Cài đặt → khoản thu định kỳ trợ cấp đã liên kết (nếu có): đổi số tiền / ngày nhận;
 * đặt trợ cấp = 0 thì dừng lịch. Không tạo mới ở đây – người dùng tự quản lý ở trang Định kỳ.
 */
export async function syncAllowanceRecurring(
  userId: string,
  preferences: unknown,
  allowance: number | undefined,
  payDay: number | undefined
): Promise<void> {
  const id = allowanceRecurringId(preferences as Parameters<typeof allowanceRecurringId>[0]);
  if (!id || (allowance === undefined && payDay === undefined)) return;
  const recurring = await prisma.recurringTransaction.findFirst({ where: { id, user_id: userId, status: { not: "cancelled" } } });
  if (!recurring) return;

  if (allowance !== undefined && allowance <= 0) {
    await prisma.recurringTransaction.update({ where: { id }, data: { status: "paused" } });
    return;
  }
  await prisma.recurringTransaction.update({
    where: { id },
    data: {
      ...(allowance !== undefined ? { amount: allowance } : {}),
      ...(payDay !== undefined && payDay !== recurring.anchor_day
        ? { anchor_day: payDay, next_run_date: ymdToStorageDate(nextPayDate(payDay)) }
        : {}),
    },
  });
}
