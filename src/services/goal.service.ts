import type { Prisma, SavingGoal } from "@prisma/client";
import type { z } from "zod";
import { prisma } from "@/lib/database/prisma";
import { ApiError, Errors } from "@/lib/api/errors";
import { assertResourceOwner } from "@/lib/auth/ownership";
import { MAX_AMOUNT, type GoalStatus } from "@/constants/finance";
import { computeGoalProgress } from "@/lib/finance/goals";
import { ymdToStorageDate } from "@/lib/utils/date";
import type { createGoalSchema, goalContributionSchema, updateGoalSchema } from "@/lib/validations/goal.schema";
import type { GoalDTO } from "@/types/finance";
import { notify } from "./notification.service";
import { onGoalCompleted, onGoalDeposit } from "./points.service";
import { toNumber } from "./mappers";

const notFound = () => Errors.notFound("GOAL_NOT_FOUND", "Không tìm thấy mục tiêu.");
const notActive = () => Errors.badRequest("Chỉ nạp/rút được với mục tiêu đang thực hiện. Hãy mở lại mục tiêu trước.");
const MILESTONES = [50, 100];

export function toGoalDTO(g: SavingGoal, now = new Date()): GoalDTO {
  const target = toNumber(g.target_amount);
  const current = toNumber(g.current_amount);
  const progress = computeGoalProgress(target, current, g.deadline, now);
  return {
    id: g.id,
    name: g.name,
    icon: g.icon,
    targetAmount: target,
    currentAmount: current,
    deadline: g.deadline?.toISOString() ?? null,
    status: g.status as GoalStatus,
    ...progress,
    createdAt: g.created_at.toISOString(),
  };
}

export async function listGoals(userId: string, includeArchived = false): Promise<GoalDTO[]> {
  const goals = await prisma.savingGoal.findMany({
    where: { user_id: userId, ...(includeArchived ? {} : { status: { not: "archived" } }) },
    orderBy: [{ status: "asc" }, { deadline: { sort: "asc", nulls: "last" } }, { created_at: "desc" }],
  });
  return goals.map((g) => toGoalDTO(g));
}

/** Tổng tiền đang để dành trong các mục tiêu chưa hoàn thành. */
export async function reservedInGoals(userId: string): Promise<number> {
  const agg = await prisma.savingGoal.aggregate({
    where: { user_id: userId, status: "active" },
    _sum: { current_amount: true },
  });
  return toNumber(agg._sum.current_amount);
}

export async function createGoal(userId: string, input: z.infer<typeof createGoalSchema>): Promise<GoalDTO> {
  const goal = await prisma.savingGoal.create({
    data: {
      user_id: userId,
      name: input.name,
      target_amount: input.target_amount,
      deadline: input.deadline ? ymdToStorageDate(input.deadline) : null,
      icon: input.icon ?? "Target",
    },
  });
  return toGoalDTO(goal);
}

async function ownGoal(userId: string, id: string) {
  const goal = await prisma.savingGoal.findUnique({ where: { id } });
  assertResourceOwner(goal, userId, notFound);
  return goal;
}

/**
 * Trạng thái mục tiêu: active ⇄ completed, active ⇄ archived, completed → archived.
 * Mục tiêu đã lưu trữ phải kích hoạt lại trước khi đánh dấu hoàn thành.
 */
export async function updateGoal(userId: string, id: string, input: z.infer<typeof updateGoalSchema>): Promise<GoalDTO> {
  const existing = await ownGoal(userId, id);
  if (input.status === "completed" && existing.status === "archived") {
    throw Errors.badRequest("Hãy kích hoạt lại mục tiêu đã lưu trữ trước khi đánh dấu hoàn thành.");
  }
  const goal = await prisma.savingGoal.update({
    where: { id },
    data: {
      name: input.name,
      target_amount: input.target_amount,
      icon: input.icon,
      status: input.status,
      deadline: input.deadline === undefined ? undefined : input.deadline ? ymdToStorageDate(input.deadline) : null,
    },
  });
  // Chỉ thưởng điểm khi mục tiêu thực sự đạt đủ số tiền: bấm "Hoàn thành" với 0 đồng không được cộng điểm.
  if (input.status === "completed" && toNumber(goal.current_amount) >= toNumber(goal.target_amount)) {
    await onGoalCompleted(userId, id);
  }
  return toGoalDTO(goal);
}

/** Chỉ xóa được mục tiêu chưa từng nạp/rút; mục tiêu đã có lịch sử phải lưu trữ để không mất dữ liệu tài chính. */
export async function deleteGoal(userId: string, id: string): Promise<void> {
  await ownGoal(userId, id);
  const history = await prisma.goalContribution.count({ where: { goal_id: id } });
  if (history > 0) {
    throw Errors.conflict("GOAL_HAS_HISTORY", "Mục tiêu đã có lịch sử nạp/rút tiền. Hãy lưu trữ thay vì xóa để giữ lịch sử.");
  }
  await prisma.savingGoal.delete({ where: { id } });
}

export async function contributeToGoal(
  userId: string,
  id: string,
  input: z.infer<typeof goalContributionSchema>
): Promise<GoalDTO> {
  const goal = await ownGoal(userId, id);
  if (goal.status !== "active") throw notActive();
  const delta = input.direction === "deposit" ? input.amount : -input.amount;

  const updated = await prisma.$transaction(async (tx) => {
    // Kiểm tra số dư và cộng/trừ trong CÙNG một câu UPDATE có điều kiện: hai lần rút đồng thời
    // không thể cùng vượt qua bước kiểm tra rồi làm số dư âm (PostgreSQL khóa dòng và đánh giá lại WHERE).
    const where: Prisma.SavingGoalWhereInput = {
      id,
      user_id: userId,
      status: "active",
      current_amount: delta < 0 ? { gte: -delta } : { lte: MAX_AMOUNT - delta },
    };
    const { count } = await tx.savingGoal.updateMany({ where, data: { current_amount: { increment: delta } } });
    if (count === 0) {
      // Phân biệt lý do: mục tiêu vừa bị xóa/lưu trữ song song thì báo đúng lỗi, không báo "không đủ số dư".
      const fresh = await tx.savingGoal.findFirst({ where: { id, user_id: userId }, select: { status: true } });
      if (!fresh) throw notFound();
      if (fresh.status !== "active") throw notActive();
      throw delta < 0
        ? new ApiError(400, "INSUFFICIENT_GOAL_BALANCE", "Số tiền rút vượt quá số đã tiết kiệm cho mục tiêu này.")
        : Errors.badRequest("Số tiền của mục tiêu vượt quá giới hạn cho phép.");
    }
    await tx.goalContribution.create({ data: { goal_id: id, amount: delta, note: input.note } });
    const after = await tx.savingGoal.findUniqueOrThrow({ where: { id } });
    // Đạt đủ số tiền → tự chuyển sang "hoàn thành" trong cùng transaction.
    if (toNumber(after.current_amount) >= toNumber(after.target_amount)) {
      return tx.savingGoal.update({ where: { id }, data: { status: "completed" } });
    }
    return after;
  });

  if (delta > 0) await onGoalDeposit(userId);

  // Tính mốc từ số dư sau cập nhật (không dùng giá trị đọc trước đó, có thể đã cũ nếu có thao tác song song).
  const target = toNumber(updated.target_amount);
  const after = toNumber(updated.current_amount);
  const before = Math.round((after - delta) * 100) / 100;
  const milestone = reachedMilestone(before, after, target);
  if (milestone) {
    await notify(userId, {
      kind: "goal",
      type: "success",
      template: "goalMilestone",
      params: { goal: updated.name, percent: milestone, current: after, target },
      link: "/goals",
      // dedupeKey theo mục tiêu + mốc: rút ra rồi nạp lại không báo lại cùng một mốc.
      dedupeKey: `goal:${id}:${milestone}`,
    });
  }
  if (milestone === 100) await onGoalCompleted(userId, id);
  return toGoalDTO(updated);
}

/** Mốc cao nhất (50% / 100%) vừa được vượt qua bởi lần nạp này, nếu có. */
export function reachedMilestone(before: number, after: number, target: number): number | undefined {
  if (target <= 0) return undefined;
  const pctBefore = (before / target) * 100;
  const pctAfter = (after / target) * 100;
  return MILESTONES.filter((m) => pctBefore < m && pctAfter >= m).pop();
}
