import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  currentMonthKey,
  shiftMonthKey,
  storageDate,
  toYmd,
  vnParts,
  ymdToStorageDate,
} from "../src/lib/utils/date";

/**
 * Seed dữ liệu demo. Script XÓA TOÀN BỘ dữ liệu trước khi nạp, nên bắt buộc chạy với SEED_RESET=true:
 *   SEED_RESET=true npm run db:seed
 * Mọi ngày tháng tính tương đối theo hôm nay (giờ Việt Nam), không hard-code tháng.
 */
const prisma = new PrismaClient();

const DEFAULT_CATEGORIES = [
  { name: "Trợ cấp gia đình", type: "income", icon: "Wallet", color: "#059669" },
  { name: "Việc làm thêm", type: "income", icon: "Briefcase", color: "#2563EB" },
  { name: "Học bổng", type: "income", icon: "GraduationCap", color: "#7C3AED" },
  { name: "Quà tặng / Thưởng", type: "income", icon: "Gift", color: "#DB2777" },
  { name: "Thu nhập khác", type: "income", icon: "Coins", color: "#D97706" },
  { name: "Ăn uống", type: "expense", icon: "Utensils", color: "#EA580C" },
  { name: "Đi lại", type: "expense", icon: "Bus", color: "#0891B2" },
  { name: "Tiền trọ / KTX", type: "expense", icon: "Home", color: "#4F46E5" },
  { name: "Học tập", type: "expense", icon: "BookOpen", color: "#0D9488" },
  { name: "Dịch vụ số", type: "expense", icon: "Tv", color: "#9333EA" },
  { name: "Giải trí", type: "expense", icon: "Film", color: "#E11D48" },
  { name: "Chi tiêu khác", type: "expense", icon: "MoreHorizontal", color: "#64748B" },
  { name: "Mua sắm", type: "expense", icon: "ShoppingBag", color: "#DB2777" },
];

/** Ngày cách hôm nay `daysAgo` ngày (giờ VN, lưu 12:00). */
function daysAgo(n: number): Date {
  const today = vnParts(new Date());
  return storageDate(today.year, today.month, today.day - n);
}

async function main() {
  if (process.env.SEED_RESET !== "true") {
    console.error("Seed sẽ xóa toàn bộ dữ liệu. Chạy lại với SEED_RESET=true nếu bạn chắc chắn.");
    process.exit(1);
  }

  await prisma.$transaction([
    prisma.notification.deleteMany(),
    prisma.goalContribution.deleteMany(),
    prisma.savingGoal.deleteMany(),
    prisma.categoryPreference.deleteMany(),
    prisma.transactionAudit.deleteMany(),
    prisma.transaction.deleteMany(),
    prisma.recurringTransaction.deleteMany(),
    prisma.savingTip.deleteMany(),
    prisma.insight.deleteMany(),
    prisma.budget.deleteMany(),
    prisma.category.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  const [studentHash, adminHash] = await Promise.all([
    bcrypt.hash("Student@123", 12),
    bcrypt.hash("Admin@123", 12),
  ]);

  const student = await prisma.user.create({
    data: {
      name: "Nguyễn Văn An",
      email: "student@campuscoin.edu",
      password_hash: studentHash,
      role: "student",
      academic_year: "Năm 3 – Công nghệ thông tin",
      monthly_allowance_baseline: 6_500_000,
      monthly_savings_goal: 800_000,
      salary_pay_day: 5,
    },
  });

  await prisma.user.create({
    data: {
      name: "Quản trị viên Campus Coin",
      email: "admin@campuscoin.edu",
      password_hash: adminHash,
      role: "admin",
      academic_year: null,
    },
  });

  const cat: Record<string, number> = {};
  for (const c of DEFAULT_CATEGORIES) {
    const created = await prisma.category.create({ data: { ...c, user_id: null, is_default: true } });
    cat[c.name] = created.id;
  }

  const month = currentMonthKey();
  for (const m of [shiftMonthKey(month, -2), shiftMonthKey(month, -1), month]) {
    await prisma.budget.createMany({
      data: [
        { name: "Ăn uống", limit: 2_200_000 },
        { name: "Đi lại", limit: 500_000 },
        { name: "Giải trí", limit: 600_000 },
        { name: "Dịch vụ số", limit: 200_000 },
      ].map((b) => ({ user_id: student.id, category_id: cat[b.name], month: m, limit_amount: b.limit })),
    });
  }

  const txs: { d: string; a: number; t: "income" | "expense"; c: string; n: number }[] = [];
  const push = (d: string, a: number, t: "income" | "expense", c: string, n: number) => txs.push({ d, a, t, c, n });

  // ~5 tháng lịch sử chi tiêu linh hoạt
  const foods = ["Cơm trưa căn tin", "Highlands Coffee", "Bánh mì sáng", "GrabFood tối", "Trà sữa", "Phở bò"];
  for (let n = 1; n <= 150; n += 1) {
    push(foods[n % foods.length], 30_000 + ((n * 7919) % 50_000), "expense", "Ăn uống", n);
    if (n % 3 === 0) push(n % 2 ? "Grab Bike đi học" : "Đổ xăng", 25_000 + ((n * 131) % 40_000), "expense", "Đi lại", n);
    if (n % 9 === 0) push(n % 2 ? "Xem phim CGV" : "Karaoke cùng lớp", 90_000 + ((n * 17) % 120_000), "expense", "Giải trí", n);
    if (n % 20 === 0) push("Mua giáo trình", 120_000 + ((n * 23) % 100_000), "expense", "Học tập", n);
    if (n % 25 === 0) push("Đơn Shopee", 150_000 + ((n * 29) % 200_000), "expense", "Mua sắm", n);
    if (n % 30 === 0) push("Lương gia sư", 1_800_000, "income", "Việc làm thêm", n);
  }
  push("Học bổng khuyến khích học tập", 3_000_000, "income", "Học bổng", 70);
  push("Tai nghe mới", 890_000, "expense", "Mua sắm", 4);

  for (const t of txs) {
    await prisma.transaction.create({
      data: {
        user_id: student.id,
        category_id: cat[t.c],
        amount: t.a,
        type: t.t,
        description: t.d,
        date: daysAgo(t.n),
      },
    });
  }

  // Khoản định kỳ bắt đầu từ ~5 tháng trước: scheduler trong app sẽ tự sinh giao dịch còn thiếu (idempotent).
  const startMonth = shiftMonthKey(month, -5);
  const recurring = [
    { name: "Trợ cấp gia đình", amount: 4_500_000, type: "income", c: "Trợ cấp gia đình", day: 5 },
    { name: "Tiền trọ", amount: 1_800_000, type: "expense", c: "Tiền trọ / KTX", day: 7 },
    { name: "Điện nước, wifi", amount: 350_000, type: "expense", c: "Tiền trọ / KTX", day: 10 },
    { name: "Spotify Premium", amount: 59_000, type: "expense", c: "Dịch vụ số", day: 15 },
    { name: "Gói cước 4G", amount: 90_000, type: "expense", c: "Dịch vụ số", day: 20 },
  ];
  for (const r of recurring) {
    const start = ymdToStorageDate(`${startMonth}-${String(r.day).padStart(2, "0")}`);
    await prisma.recurringTransaction.create({
      data: {
        user_id: student.id,
        category_id: cat[r.c],
        name: r.name,
        amount: r.amount,
        type: r.type,
        frequency: "monthly",
        anchor_day: r.day,
        start_date: start,
        next_run_date: start,
      },
    });
  }

  const laptop = await prisma.savingGoal.create({
    data: {
      user_id: student.id,
      name: "Laptop mới",
      icon: "Laptop",
      target_amount: 25_000_000,
      current_amount: 12_500_000,
      deadline: ymdToStorageDate(`${shiftMonthKey(month, 8)}-01`),
    },
  });
  await prisma.goalContribution.create({ data: { goal_id: laptop.id, amount: 12_500_000, note: "Số dư ban đầu" } });
  await prisma.savingGoal.create({
    data: {
      user_id: student.id,
      name: "Quỹ khẩn cấp",
      icon: "ShieldCheck",
      target_amount: 5_000_000,
      current_amount: 0,
    },
  });

  await prisma.notification.create({
    data: {
      user_id: student.id,
      kind: "system",
      type: "info",
      title: "Chào mừng đến với Campus Coin",
      message: "Thêm giao dịch đầu tiên hoặc đặt ngân sách tháng để bắt đầu theo dõi tài chính.",
      dedupe_key: "welcome",
    },
  });

  console.log(`Seed hoàn tất: ${txs.length} giao dịch, ${recurring.length} khoản định kỳ (tính đến ${toYmd(new Date())}).`);
  console.log("Tài khoản demo: student@campuscoin.edu / Student@123 · admin@campuscoin.edu / Admin@123");
}

main()
  .catch((e) => {
    console.error("Seed thất bại:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
