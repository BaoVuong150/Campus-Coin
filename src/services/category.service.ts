import type { Category, Prisma } from "@prisma/client";
import { prisma } from "@/lib/database/prisma";
import { Errors } from "@/lib/api/errors";
import {
  CANONICAL_CATEGORY_NAMES,
  fallbackCategory,
  matchRule,
  normalizeText,
  preferenceKey,
  type CanonicalCategory,
} from "@/lib/finance/categorize";
import type { CreateCategoryInput } from "@/lib/validations/category.schema";
import type { CategoryDTO, CategorySuggestion, TransactionType } from "@/types/finance";
import { asType, toCategoryDTO } from "./mappers";

const categoryNotFound = () => Errors.notFound("CATEGORY_NOT_FOUND", "Không tìm thấy danh mục.");

/** Danh mục user được phép dùng: danh mục hệ thống (user_id null) hoặc danh mục của chính user. */
export const usableCategoryWhere = (userId: string): Prisma.CategoryWhereInput => ({
  OR: [{ user_id: null }, { user_id: userId }],
});

export async function listCategories(userId: string, type?: TransactionType): Promise<CategoryDTO[]> {
  const categories = await prisma.category.findMany({
    where: { AND: [usableCategoryWhere(userId), type ? { type } : {}] },
    orderBy: [{ type: "asc" }, { user_id: { sort: "asc", nulls: "first" } }, { id: "asc" }],
  });
  return categories.map(toCategoryDTO);
}

/** Trả về danh mục nếu user được phép dùng; kiểm tra luôn loại thu/chi khớp với giao dịch. */
export async function getUsableCategory(
  userId: string,
  categoryId: number,
  expectedType?: TransactionType
): Promise<Category> {
  const category = await prisma.category.findFirst({
    where: { id: categoryId, ...usableCategoryWhere(userId) },
  });
  if (!category) throw categoryNotFound();
  if (expectedType && category.type !== expectedType) {
    throw Errors.badRequest("Danh mục không khớp với loại giao dịch.", { category_id: "Danh mục không khớp loại thu/chi." });
  }
  return category;
}

export async function createUserCategory(userId: string, input: CreateCategoryInput): Promise<CategoryDTO> {
  const category = await prisma.category.create({
    data: {
      user_id: userId,
      name: input.name,
      type: input.type,
      icon: input.icon ?? "Tag",
      color: input.color ?? null,
      is_default: false,
    },
  });
  return toCategoryDTO(category);
}

export async function updateUserCategory(
  userId: string,
  id: number,
  input: Partial<CreateCategoryInput>
): Promise<CategoryDTO> {
  const existing = await prisma.category.findFirst({ where: { id, user_id: userId } });
  if (!existing) throw categoryNotFound();
  if (input.type && input.type !== existing.type) await assertCategoryUnused(id);
  const updated = await prisma.category.update({ where: { id }, data: input });
  return toCategoryDTO(updated);
}

/**
 * Danh mục đang được giao dịch, lịch định kỳ hoặc ngân sách dùng thì không được xóa/đổi loại thu-chi.
 * Ngân sách có quan hệ ON DELETE CASCADE ở DB, nên nếu không chặn ở đây việc xóa danh mục sẽ âm thầm xóa
 * ngân sách của user (với danh mục hệ thống: ngân sách của MỌI user), và đổi loại sẽ để lại ngân sách
 * gắn với danh mục thu nhập.
 */
async function assertCategoryUnused(id: number) {
  const [txCount, recurringCount, budgetCount] = await Promise.all([
    prisma.transaction.count({ where: { category_id: id } }),
    prisma.recurringTransaction.count({ where: { category_id: id } }),
    prisma.budget.count({ where: { category_id: id } }),
  ]);
  if (txCount + recurringCount + budgetCount > 0) {
    throw Errors.conflict(
      "CATEGORY_IN_USE",
      "Danh mục đang được dùng bởi giao dịch, khoản định kỳ hoặc ngân sách, không thể xóa hoặc đổi loại."
    );
  }
}

export async function deleteUserCategory(userId: string, id: number): Promise<void> {
  const existing = await prisma.category.findFirst({ where: { id, user_id: userId } });
  if (!existing) throw categoryNotFound();
  await assertCategoryUnused(id);
  await prisma.category.delete({ where: { id } });
}

// ---------- Danh mục hệ thống (admin) ----------

export async function listDefaultCategories(): Promise<(CategoryDTO & { usage: number })[]> {
  const [categories, usage] = await Promise.all([
    prisma.category.findMany({ where: { user_id: null }, orderBy: [{ type: "asc" }, { id: "asc" }] }),
    prisma.transaction.groupBy({ by: ["category_id"], _count: { _all: true } }),
  ]);
  const usageMap = new Map(usage.map((u) => [u.category_id, u._count._all]));
  return categories.map((c) => ({ ...toCategoryDTO(c), usage: usageMap.get(c.id) ?? 0 }));
}

export async function createDefaultCategory(input: CreateCategoryInput): Promise<CategoryDTO> {
  const category = await prisma.category.create({
    data: { ...input, icon: input.icon ?? "Tag", user_id: null, is_default: true },
  });
  return toCategoryDTO(category);
}

export async function updateDefaultCategory(id: number, input: Partial<CreateCategoryInput>): Promise<CategoryDTO> {
  const existing = await prisma.category.findFirst({ where: { id, user_id: null } });
  if (!existing) throw categoryNotFound();
  if (input.type && input.type !== existing.type) await assertCategoryUnused(id);
  return toCategoryDTO(await prisma.category.update({ where: { id }, data: input }));
}

export async function deleteDefaultCategory(id: number): Promise<void> {
  const existing = await prisma.category.findFirst({ where: { id, user_id: null } });
  if (!existing) throw categoryNotFound();
  await assertCategoryUnused(id);
  await prisma.category.delete({ where: { id } });
}

// ---------- Smart categorization ----------

const HISTORY_SAMPLE = 20;
const MIN_HISTORY_QUERY_LENGTH = 3;

function mostFrequent(ids: number[]): number | null {
  const counts = new Map<number, number>();
  for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1);
  let best: number | null = null;
  for (const [id, count] of counts) if (best === null || count > (counts.get(best) ?? 0)) best = id;
  return best;
}

function findCanonical(categories: Category[], canonical: CanonicalCategory): Category | undefined {
  const target = CANONICAL_CATEGORY_NAMES[canonical];
  return categories.find((c) => c.user_id === null && normalizeText(c.name) === target);
}

const BATCH_HISTORY_SIZE = 500;

/** Dữ liệu của chính user dùng để gợi ý danh mục – không bao giờ chứa dữ liệu của người khác. */
interface SuggestionContext {
  categories: Category[];
  preferences: Map<string, number>;
  history: { description: string; category_id: number; type: string }[];
}

/** Hai từ đầu của mô tả, dùng làm từ khóa tìm trong lịch sử của user. */
export const historyQuery = (text: string) => text.trim().split(/\s+/).slice(0, 2).join(" ");

/** Lõi gợi ý: lựa chọn đã ghi nhớ → lịch sử của user → từ khóa merchant → danh mục mặc định. */
function pickSuggestion(ctx: SuggestionContext, text: string, type?: TransactionType): CategorySuggestion | null {
  const categories = type ? ctx.categories.filter((c) => c.type === type) : ctx.categories;
  const byId = new Map(categories.map((c) => [c.id, c]));
  const build = (c: Category, source: CategorySuggestion["source"]): CategorySuggestion => ({
    categoryId: c.id,
    categoryName: c.name,
    type: asType(c.type),
    source,
  });

  const preferred = byId.get(ctx.preferences.get(preferenceKey(text)) ?? -1);
  if (preferred) return build(preferred, "preference");

  const query = historyQuery(text);
  if (query.length >= MIN_HISTORY_QUERY_LENGTH) {
    // Chỉ khớp trọn từ: "Shopee" không khớp "ShopeeFood".
    const needle = ` ${normalizeText(query)} `;
    const matches = ctx.history.filter(
      (h) => (!type || h.type === type) && ` ${normalizeText(h.description)} `.includes(needle)
    );
    const fromHistory = byId.get(mostFrequent(matches.slice(0, HISTORY_SAMPLE).map((h) => h.category_id)) ?? -1);
    if (fromHistory) return build(fromHistory, "history");
  }

  const rule = matchRule(text, type);
  const ruled = rule ? findCanonical(categories, rule.category) : undefined;
  if (ruled) return build(ruled, "rule");

  const fallback = type ? findCanonical(categories, fallbackCategory(type)) : undefined;
  return fallback ? build(fallback, "default") : null;
}

/** Gợi ý cho một mô tả (khi đang gõ): chỉ truy vấn đúng phần dữ liệu cần thiết của user. */
export async function suggestCategory(
  userId: string,
  text: string,
  type?: TransactionType
): Promise<CategorySuggestion | null> {
  const key = preferenceKey(text);
  const query = historyQuery(text);
  const [categories, preference, history] = await Promise.all([
    prisma.category.findMany({ where: { AND: [usableCategoryWhere(userId), type ? { type } : {}] } }),
    key ? prisma.categoryPreference.findUnique({ where: { user_id_keyword: { user_id: userId, keyword: key } } }) : null,
    query.length >= MIN_HISTORY_QUERY_LENGTH
      ? prisma.transaction.findMany({
          where: { user_id: userId, description: { contains: query, mode: "insensitive" }, ...(type ? { type } : {}) },
          select: { category_id: true, description: true, type: true },
          orderBy: { date: "desc" },
          take: HISTORY_SAMPLE,
        })
      : [],
  ]);
  return pickSuggestion(
    { categories, preferences: new Map(preference && key ? [[key, preference.category_id]] : []), history },
    text,
    type
  );
}

/** Gợi ý hàng loạt (nhập CSV): nạp ngữ cảnh một lần rồi xử lý trong bộ nhớ. */
export async function suggestCategories(
  userId: string,
  items: { text: string; type: TransactionType }[]
): Promise<(CategorySuggestion | null)[]> {
  const [categories, preferences, history] = await Promise.all([
    prisma.category.findMany({ where: usableCategoryWhere(userId) }),
    prisma.categoryPreference.findMany({ where: { user_id: userId }, select: { keyword: true, category_id: true } }),
    prisma.transaction.findMany({
      where: { user_id: userId },
      select: { category_id: true, description: true, type: true },
      orderBy: { date: "desc" },
      take: BATCH_HISTORY_SIZE,
    }),
  ]);
  const ctx: SuggestionContext = {
    categories,
    preferences: new Map(preferences.map((p) => [p.keyword, p.category_id])),
    history,
  };
  return items.map((item) => pickSuggestion(ctx, item.text, item.type));
}

/** Ghi nhớ lựa chọn danh mục của user cho mô tả này (chỉ ảnh hưởng gợi ý của chính user). */
export async function rememberCategoryChoice(userId: string, description: string, categoryId: number) {
  const keyword = preferenceKey(description);
  if (!keyword) return;
  await prisma.categoryPreference.upsert({
    where: { user_id_keyword: { user_id: userId, keyword } },
    create: { user_id: userId, keyword, category_id: categoryId },
    update: { category_id: categoryId, hits: { increment: 1 } },
  });
}
