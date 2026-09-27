import type { SavingGoal } from "@prisma/client";
import type { z } from "zod";
import { prisma } from "@/lib/database/prisma";
import { ApiError, Errors } from "@/lib/api/errors";
import { assertResourceOwner } from "@/lib/auth/ownership";
import type { GoalStatus } from "@/constants/finance";
import { computeGoalProgress } from "@/lib/finance/goals";
import { ymdToStorageDate } from "@/lib/utils/date";
import type { createGoalSchema, goalContributionSchema, updateGoalSchema } from "@/lib/validations/goal.schema";
import type { GoalDTO } from "@/types/finance";
import { notify } from "./notification.service";
import { onGoalCompleted, onGoalDeposit } from "./points.service";
import { toNumber } from "./mappers";

const notFound = () => Errors.notFound("GOAL_NOT_FOUND", "Không tìm thấy mục tiêu.");
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

export async function updateGoal(userId: string, id: string, input: z.infer<typeof updateGoalSchema>): Promise<GoalDTO> {
  await ownGoal(userId, id);
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
  if (input.status === "completed") await onGoalCompleted(userId, id);
  return toGoalDTO(goal);
}

export async function deleteGoal(userId: string, id: string): Promise<void> {
  await ownGoal(userId, id);
  await prisma.savingGoal.delete({ where: { id } });
}

export async function contributeToGoal(
  userId: string,
  id: string,
  input: z.infer<typeof goalContributionSchema>
): Promise<GoalDTO> {
  const goal = await ownGoal(userId, id);
  const current = toNumber(goal.current_amount);
  const delta = input.direction === "deposit" ? input.amount : -input.amount;
  if (current + delta < 0) {
    throw new ApiError(400, "INSUFFICIENT_GOAL_BALANCE", "Số tiền rút vượt quá số đã tiết kiệm cho mục tiêu này.");
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.goalContribution.create({ data: { goal_id: id, amount: delta, note: input.note } });
    return tx.savingGoal.update({ where: { id }, data: { current_amount: { increment: delta } } });
  });

  if (delta > 0) await onGoalDeposit(userId, id);

  const target = toNumber(updated.target_amount);
  const before = target > 0 ? (current / target) * 100 : 0;
  const after = target > 0 ? (toNumber(updated.current_amount) / target) * 100 : 0;
  const milestone = MILESTONES.filter((m) => before < m && after >= m).pop();
  if (milestone) {
    await notify(userId, {
      kind: "goal",
      type: "success",
      template: "goalMilestone",
      params: { goal: updated.name, percent: milestone, current: toNumber(updated.current_amount), target },
      link: "/goals",
      dedupeKey: `goal:${id}:${milestone}`,
    });
  }
  if (milestone === 100) await onGoalCompleted(userId, id);
  return toGoalDTO(updated);
}
