import { beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const cookieStore = { value: undefined as string | undefined };

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => (cookieStore.value ? { value: cookieStore.value } : undefined) }),
}));

const db = vi.hoisted(() => ({
  user: { findUnique: vi.fn(), update: vi.fn() },
  category: { findFirst: vi.fn(), findMany: vi.fn() },
  categoryPreference: { findUnique: vi.fn(), upsert: vi.fn() },
  transaction: { findFirst: vi.fn(), findMany: vi.fn(), update: vi.fn(), delete: vi.fn(), create: vi.fn() },
  transactionAudit: { create: vi.fn() },
  $transaction: vi.fn(),
}));

vi.mock("@/lib/database/prisma", () => ({ prisma: db }));

import { sessionVersion, signToken, verifyToken } from "@/lib/auth/jwt";
import { requireAdmin, requireAuth } from "@/lib/auth/session";
import { ApiError } from "@/lib/api/errors";
import { authenticate, INVALID_CREDENTIALS_MESSAGE } from "@/services/user.service";
import { deleteTransaction, getTransaction, updateTransaction } from "@/services/transaction.service";
import { getUsableCategory, suggestCategory } from "@/services/category.service";

const USER_A = "11111111-1111-4111-8111-111111111111";
const USER_B = "22222222-2222-4222-8222-222222222222";
const TX_B = "33333333-3333-4333-8333-333333333333";

const PASSWORD_HASH = "$2b$04$storedhashstoredhashstoredhashstoredhashstoredhash12";
const SV = sessionVersion(PASSWORD_HASH);

const activeUser = (id: string, role = "student") => ({
  id,
  name: "Test",
  email: `${id}@test.dev`,
  role,
  is_active: true,
  password_hash: PASSWORD_HASH,
});

beforeEach(() => {
  vi.clearAllMocks();
  cookieStore.value = undefined;
});

async function expectApiError(promise: Promise<unknown>, code: string) {
  await expect(promise).rejects.toBeInstanceOf(ApiError);
  await promise.catch((e: ApiError) => expect(e.code).toBe(code));
}

describe("auth: login", () => {
  it("đăng nhập đúng trả về user", async () => {
    const hash = await bcrypt.hash("Student@123", 4);
    db.user.findUnique.mockResolvedValue({ ...activeUser(USER_A), password_hash: hash });
    const grant = await authenticate({ email: "a@test.dev", password: "Student@123", portal: "student" });
    expect(grant.user.id).toBe(USER_A);
    expect(grant.sv).toBe(sessionVersion(hash));
  });

  it("sai mật khẩu và email không tồn tại trả về cùng một thông báo", async () => {
    const hash = await bcrypt.hash("Student@123", 4);
    db.user.findUnique.mockResolvedValueOnce({ ...activeUser(USER_A), password_hash: hash });
    const wrongPassword = await authenticate({ email: "a@test.dev", password: "Wrong@123", portal: "student" }).catch((e) => e);

    db.user.findUnique.mockResolvedValueOnce(null);
    const unknownEmail = await authenticate({ email: "x@test.dev", password: "Wrong@123", portal: "student" }).catch((e) => e);

    expect(wrongPassword.code).toBe("INVALID_CREDENTIALS");
    expect(unknownEmail.code).toBe("INVALID_CREDENTIALS");
    expect(wrongPassword.message).toBe(INVALID_CREDENTIALS_MESSAGE);
    expect(unknownEmail.message).toBe(wrongPassword.message);
  });

  it("cổng admin từ chối tài khoản sinh viên", async () => {
    const hash = await bcrypt.hash("Student@123", 4);
    db.user.findUnique.mockResolvedValue({ ...activeUser(USER_A), password_hash: hash });
    await expectApiError(authenticate({ email: "a@test.dev", password: "Student@123", portal: "admin" }), "INVALID_CREDENTIALS");
  });
});

describe("auth: session", () => {
  it("token hết hạn → SESSION_EXPIRED", async () => {
    const expired = jwt.sign({ userId: USER_A, role: "student" }, process.env.JWT_SECRET!, { expiresIn: -10 });
    expect(verifyToken(expired).status).toBe("expired");
    cookieStore.value = expired;
    await expectApiError(requireAuth(), "SESSION_EXPIRED");
  });

  it("token bị giả mạo chữ ký bị từ chối", () => {
    const forged = jwt.sign({ userId: USER_A, role: "admin" }, "another-secret-another-secret-123456");
    expect(verifyToken(forged).status).toBe("invalid");
  });

  it("tài khoản bị vô hiệu hóa không dùng được phiên cũ", async () => {
    cookieStore.value = signToken({ userId: USER_A, email: "a", role: "student", name: "A", sv: SV });
    db.user.findUnique.mockResolvedValue({ ...activeUser(USER_A), is_active: false });
    await expectApiError(requireAuth(), "ACCOUNT_DISABLED");
  });
});

describe("admin: phân quyền server-side", () => {
  it("non-admin bị từ chối", async () => {
    cookieStore.value = signToken({ userId: USER_A, email: "a", role: "student", name: "A", sv: SV });
    db.user.findUnique.mockResolvedValue(activeUser(USER_A, "student"));
    await expectApiError(requireAdmin(), "FORBIDDEN");
  });

  it("token ghi role admin nhưng DB là student → vẫn bị từ chối", async () => {
    cookieStore.value = signToken({ userId: USER_A, email: "a", role: "admin", name: "A", sv: SV });
    db.user.findUnique.mockResolvedValue(activeUser(USER_A, "student"));
    await expectApiError(requireAdmin(), "FORBIDDEN");
  });

  it("admin được phép", async () => {
    cookieStore.value = signToken({ userId: USER_A, email: "a", role: "admin", name: "A", sv: SV });
    db.user.findUnique.mockResolvedValue(activeUser(USER_A, "admin"));
    await expect(requireAdmin()).resolves.toMatchObject({ id: USER_A, role: "admin" });
  });

  it("chưa đăng nhập → UNAUTHORIZED", async () => {
    await expectApiError(requireAdmin(), "UNAUTHORIZED");
  });
});

describe("transactions: ownership (IDOR)", () => {
  it("mọi truy vấn giao dịch đều lọc theo user_id của người gọi", async () => {
    db.transaction.findFirst.mockResolvedValue(null);
    await expectApiError(getTransaction(USER_A, TX_B), "TRANSACTION_NOT_FOUND");
    expect(db.transaction.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ id: TX_B, user_id: USER_A }) })
    );
  });

  it("user A không sửa được giao dịch của user B", async () => {
    db.transaction.findFirst.mockResolvedValue(null);
    await expectApiError(updateTransaction(USER_A, TX_B, { amount: 1 }), "TRANSACTION_NOT_FOUND");
    expect(db.transaction.update).not.toHaveBeenCalled();
  });

  it("user A không xóa được giao dịch của user B", async () => {
    db.transaction.findFirst.mockResolvedValue(null);
    await expectApiError(deleteTransaction(USER_A, TX_B), "TRANSACTION_NOT_FOUND");
    expect(db.transaction.delete).not.toHaveBeenCalled();
  });
});

describe("categories: ownership", () => {
  it("không dùng được danh mục cá nhân của user khác", async () => {
    db.category.findFirst.mockResolvedValue(null);
    await expectApiError(getUsableCategory(USER_A, 99), "CATEGORY_NOT_FOUND");
    expect(db.category.findFirst).toHaveBeenCalledWith({
      where: { id: 99, OR: [{ user_id: null }, { user_id: USER_A }] },
    });
  });

  it("từ chối danh mục sai loại thu/chi", async () => {
    db.category.findFirst.mockResolvedValue({ id: 1, type: "income", user_id: null });
    await expectApiError(getUsableCategory(USER_A, 1, "expense"), "VALIDATION_ERROR");
  });
});

describe("smart categorization: cô lập dữ liệu", () => {
  it("chỉ đọc lịch sử và preference của chính user", async () => {
    db.category.findMany.mockResolvedValue([
      { id: 6, name: "Ăn uống", type: "expense", user_id: null },
      { id: 12, name: "Chi tiêu khác", type: "expense", user_id: null },
    ]);
    db.categoryPreference.findUnique.mockResolvedValue(null);
    db.transaction.findMany.mockResolvedValue([]);

    const suggestion = await suggestCategory(USER_A, "Highlands Coffee", "expense");

    expect(suggestion).toMatchObject({ categoryId: 6, source: "rule" });
    expect(db.categoryPreference.findUnique).toHaveBeenCalledWith({
      where: { user_id_keyword: { user_id: USER_A, keyword: "highlands coffee" } },
    });
    for (const [args] of db.transaction.findMany.mock.calls) {
      expect(args.where.user_id).toBe(USER_A);
    }
    for (const [args] of db.category.findMany.mock.calls) {
      expect(JSON.stringify(args.where)).not.toContain(USER_B);
    }
  });

  it("ưu tiên lựa chọn đã ghi nhớ của user", async () => {
    db.category.findMany.mockResolvedValue([
      { id: 6, name: "Ăn uống", type: "expense", user_id: null },
      { id: 50, name: "Cafe học bài", type: "expense", user_id: USER_A },
    ]);
    db.categoryPreference.findUnique.mockResolvedValue({ category_id: 50 });
    const suggestion = await suggestCategory(USER_A, "Highlands Coffee", "expense");
    expect(suggestion).toMatchObject({ categoryId: 50, source: "preference" });
  });
});
