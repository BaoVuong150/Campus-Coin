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

async function assertCategoryUnused(id: number) {
  const [txCount, recurringCount] = await Promise.all([
    prisma.transaction.count({ where: { category_id: id } }),
    prisma.recurringTransaction.count({ where: { category_id: id } }),
  ]);
  if (txCount + recurringCount > 0) {
    throw Errors.conflict("CATEGORY_IN_USE", "Danh mục đang được sử dụng bởi giao dịch, không thể xóa hoặc đổi loại.");
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

/**
 * Gợi ý danh mục cho mô tả giao dịch. Mọi truy vấn đều giới hạn trong dữ liệu của chính user,
 * không bao giờ đọc lịch sử của người khác.
 */
export async function suggestCategory(
  userId: string,
  text: string,
  type?: TransactionType
): Promise<CategorySuggestion | null> {
  const categories = await prisma.category.findMany({
    where: { AND: [usableCategoryWhere(userId), type ? { type } : {}] },
  });
  const byId = new Map(categories.map((c) => [c.id, c]));
  const build = (c: Category, source: CategorySuggestion["source"]): CategorySuggestion => ({
    categoryId: c.id,
    categoryName: c.name,
    type: asType(c.type),
    source,
  });

  const key = preferenceKey(text);
  if (key) {
    const pref = await prisma.categoryPreference.findUnique({
      where: { user_id_keyword: { user_id: userId, keyword: key } },
    });
    const prefCategory = pref ? byId.get(pref.category_id) : undefined;
    if (prefCategory) return build(prefCategory, "preference");
  }

  const query = text.trim().split(/\s+/).slice(0, 2).join(" ");
  if (query.length >= MIN_HISTORY_QUERY_LENGTH) {
    const history = await prisma.transaction.findMany({
      where: {
        user_id: userId,
        description: { contains: query, mode: "insensitive" },
        ...(type ? { type } : {}),
      },
      select: { category_id: true, description: true },
      orderBy: { date: "desc" },
      take: HISTORY_SAMPLE,
    });
    // DB lọc "contains" (thô), sau đó chỉ giữ khớp trọn từ: "Shopee" không khớp "ShopeeFood".
    const needle = ` ${normalizeText(query)} `;
    const matches = history.filter((h) => ` ${normalizeText(h.description)} `.includes(needle));
    const historyId = mostFrequent(matches.map((h) => h.category_id));
    const historyCategory = historyId !== null ? byId.get(historyId) : undefined;
    if (historyCategory) return build(historyCategory, "history");
  }

  const rule = matchRule(text, type);
  if (rule) {
    const matched = findCanonical(categories, rule.category);
    if (matched) return build(matched, "rule");
  }

  if (type) {
    const fallback = findCanonical(categories, fallbackCategory(type));
    if (fallback) return build(fallback, "default");
  }
  return null;
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
