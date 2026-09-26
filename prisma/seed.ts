import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Bắt đầu nạp dữ liệu mẫu (Seed Data)...");

  // 1. Dọn dẹp dữ liệu cũ (nếu có)
  await prisma.notification.deleteMany();
  await prisma.savingTip.deleteMany();
  await prisma.insight.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // 2. Tạo Mật khẩu băm an toàn
  const studentPasswordHash = await bcrypt.hash("Student@123", 10);
  const adminPasswordHash = await bcrypt.hash("Admin@123", 10);

  // 3. Tạo tài khoản mẫu Sinh viên & Admin
  const student = await prisma.user.create({
    data: {
      name: "Nguyễn Văn An",
      email: "student@campuscoin.edu",
      password_hash: studentPasswordHash,
      role: "student",
      academic_year: "Năm 3 (CNTT - Đại học Bách Khoa)",
      monthly_allowance_baseline: 6000000, // 6,000,000 VND
      monthly_savings_goal: 1500000,       // 1,500,000 VND
    },
  });

  const admin = await prisma.user.create({
    data: {
      name: "Quản trị viên Campus Coin",
      email: "admin@campuscoin.edu",
      password_hash: adminPasswordHash,
      role: "admin",
      academic_year: "Ban Quản Trị Hệ Thống",
      monthly_allowance_baseline: 0,
      monthly_savings_goal: 0,
    },
  });

  console.log(`✅ Đã tạo tài khoản Sinh viên: student@campuscoin.edu (Pass: Student@123)`);
  console.log(`✅ Đã tạo tài khoản Admin: admin@campuscoin.edu (Pass: Admin@123)`);

  // 4. Tạo Danh mục Thu & Chi mặc định toàn hệ thống (Tiếng Việt)
  const defaultCategories = [
    // Thu nhập (Income)
    { name: "Trợ cấp gia đình", type: "income", icon: "Wallet", color: "#10B981", is_default: true },
    { name: "Việc làm thêm", type: "income", icon: "Briefcase", color: "#3B82F6", is_default: true },
    { name: "Học bổng", type: "income", icon: "GraduationCap", color: "#8B5CF6", is_default: true },
    { name: "Quà tặng / Thưởng", type: "income", icon: "Gift", color: "#EC4899", is_default: true },
    { name: "Thu nhập khác", type: "income", icon: "Coins", color: "#F59E0B", is_default: true },

    // Chi tiêu (Expense)
    { name: "Ăn uống", type: "expense", icon: "Utensils", color: "#EF4444", is_default: true },
    { name: "Đi lại", type: "expense", icon: "Bus", color: "#F97316", is_default: true },
    { name: "Tiền trọ / KTX", type: "expense", icon: "Home", color: "#6366F1", is_default: true },
    { name: "Học tập", type: "expense", icon: "BookOpen", color: "#06B6D4", is_default: true },
    { name: "Dịch vụ số", type: "expense", icon: "Tv", color: "#14B8A6", is_default: true },
    { name: "Giải trí", type: "expense", icon: "Film", color: "#A855F7", is_default: true },
    { name: "Chi tiêu khác", type: "expense", icon: "MoreHorizontal", color: "#64748B", is_default: true },
  ];

  const createdCategories: Record<string, number> = {};
  for (const cat of defaultCategories) {
    const record = await prisma.category.create({ data: cat });
    createdCategories[cat.name] = record.id;
  }
  console.log(`✅ Đã tạo ${defaultCategories.length} danh mục mặc định chuẩn Tiếng Việt.`);

  // 5. Tạo ngân sách (Budget) tháng hiện tại (2026-09) cho sinh viên
  const currentMonth = "2026-09";
  const budgetsData = [
    { name: "Ăn uống", limit: 2500000 },
    { name: "Đi lại", limit: 500000 },
    { name: "Tiền trọ / KTX", limit: 2000000 },
    { name: "Giải trí", limit: 800000 },
    { name: "Dịch vụ số", limit: 200000 },
  ];

  for (const b of budgetsData) {
    await prisma.budget.create({
      data: {
        user_id: student.id,
        category_id: createdCategories[b.name],
        month: currentMonth,
        limit_amount: b.limit,
      },
    });
  }
  console.log(`✅ Đã tạo ngân sách chi tiêu cho tháng ${currentMonth}.`);

  // 6. Tạo lịch sử giao dịch sinh động cho 6 tháng gần nhất (để vẽ biểu đồ 6 tháng SRS 3.6)
  const now = new Date();
  const transactionsData = [
    // Tháng 9 (Tháng hiện tại)
    { desc: "Trợ cấp gia đình đầu tháng 9", amount: 4500000, type: "income", cat: "Trợ cấp gia đình", daysAgo: 25, isRec: true },
    { desc: "Lương dạy gia sư tháng 8", amount: 2000000, type: "income", cat: "Việc làm thêm", daysAgo: 20 },
    { desc: "Tiền trọ tháng 9", amount: 2000000, type: "expense", cat: "Tiền trọ / KTX", daysAgo: 24, isRec: true },
    { desc: "Căn tin đại học tuần 1", amount: 350000, type: "expense", cat: "Ăn uống", daysAgo: 22, aiCat: createdCategories["Ăn uống"] },
    { desc: "Đổ xăng xe máy", amount: 100000, type: "expense", cat: "Đi lại", daysAgo: 19 },
    { desc: "Gói gia hạn Spotify Premium", amount: 59000, type: "expense", cat: "Dịch vụ số", daysAgo: 18, isRec: true },
    { desc: "Ăn tối lẩu liên hoan lớp", amount: 280000, type: "expense", cat: "Giải trí", daysAgo: 15 },
    { desc: "Mua giáo trình Lập trình mạng", amount: 160000, type: "expense", cat: "Học tập", daysAgo: 12 },
    { desc: "Căn tin & Cà phê học bài", amount: 220000, type: "expense", cat: "Ăn uống", daysAgo: 10 },
    { desc: "Tiền thưởng học sinh giỏi kỳ hè", amount: 1000000, type: "income", cat: "Học bổng", daysAgo: 8 },
    { desc: "Đi xem phim rạp cùng bạn", amount: 140000, type: "expense", cat: "Giải trí", daysAgo: 5 },
    { desc: "Giao đồ ăn ShopeeFood", amount: 185000, type: "expense", cat: "Ăn uống", daysAgo: 2, aiCat: createdCategories["Ăn uống"] },

    // Tháng 8 (30-60 ngày trước)
    { desc: "Trợ cấp gia đình tháng 8", amount: 4500000, type: "income", cat: "Trợ cấp gia đình", daysAgo: 55, isRec: true },
    { desc: "Lương làm thêm hè", amount: 2500000, type: "income", cat: "Việc làm thêm", daysAgo: 50 },
    { desc: "Tiền trọ tháng 8", amount: 2000000, type: "expense", cat: "Tiền trọ / KTX", daysAgo: 54, isRec: true },
    { desc: "Ăn uống tháng 8", amount: 2200000, type: "expense", cat: "Ăn uống", daysAgo: 45 },
    { desc: "Vé xe về thăm nhà", amount: 320000, type: "expense", cat: "Đi lại", daysAgo: 40 },
    { desc: "Xem phim & Cafe bạn bè", amount: 650000, type: "expense", cat: "Giải trí", daysAgo: 38 },

    // Tháng 7 (60-90 ngày trước)
    { desc: "Trợ cấp gia đình tháng 7", amount: 4000000, type: "income", cat: "Trợ cấp gia đình", daysAgo: 85 },
    { desc: "Tiền thưởng sinh nhật từ bố mẹ", amount: 1000000, type: "income", cat: "Quà tặng / Thưởng", daysAgo: 80 },
    { desc: "Tiền trọ tháng 7", amount: 2000000, type: "expense", cat: "Tiền trọ / KTX", daysAgo: 84 },
    { desc: "Chi phí ăn uống tháng 7", amount: 1950000, type: "expense", cat: "Ăn uống", daysAgo: 75 },
    { desc: "Bảo dưỡng xe máy", amount: 450000, type: "expense", cat: "Đi lại", daysAgo: 70 },

    // Tháng 6 (90-120 ngày trước)
    { desc: "Trợ cấp tháng 6", amount: 4500000, type: "income", cat: "Trợ cấp gia đình", daysAgo: 115 },
    { desc: "Tiền trọ tháng 6", amount: 2000000, type: "expense", cat: "Tiền trọ / KTX", daysAgo: 114 },
    { desc: "Ăn uống & Căn tin tháng 6", amount: 2100000, type: "expense", cat: "Ăn uống", daysAgo: 105 },
    { desc: "Mua tài liệu ôn thi cuối kỳ", amount: 350000, type: "expense", cat: "Học tập", daysAgo: 100 },

    // Tháng 5 (120-150 ngày trước)
    { desc: "Trợ cấp tháng 5", amount: 4500000, type: "income", cat: "Trợ cấp gia đình", daysAgo: 145 },
    { desc: "Học bổng khuyến khích học tập kỳ 2", amount: 3000000, type: "income", cat: "Học bổng", daysAgo: 140 },
    { desc: "Tiền trọ tháng 5", amount: 2000000, type: "expense", cat: "Tiền trọ / KTX", daysAgo: 144 },
    { desc: "Ăn uống sinh hoạt tháng 5", amount: 2300000, type: "expense", cat: "Ăn uống", daysAgo: 135 },

    // Tháng 4 (150-180 ngày trước)
    { desc: "Trợ cấp tháng 4", amount: 4500000, type: "income", cat: "Trợ cấp gia đình", daysAgo: 175 },
    { desc: "Tiền trọ tháng 4", amount: 2000000, type: "expense", cat: "Tiền trọ / KTX", daysAgo: 174 },
    { desc: "Ăn uống tháng 4", amount: 1900000, type: "expense", cat: "Ăn uống", daysAgo: 165 },
  ];

  for (const t of transactionsData) {
    const txDate = new Date();
    txDate.setDate(now.getDate() - t.daysAgo);

    await prisma.transaction.create({
      data: {
        user_id: student.id,
        category_id: createdCategories[t.cat],
        amount: t.amount,
        type: t.type,
        description: t.desc,
        ai_suggested_category: t.aiCat || null,
        date: txDate,
        is_recurring: t.isRec || false,
        recurrence_period: t.isRec ? "monthly" : null,
      },
    });
  }
  console.log(`✅ Đã tạo ${transactionsData.length} giao dịch mẫu trải dài trong 6 tháng.`);

  // 7. Tạo AI Monthly Insights mẫu (SRS 3.7)
  await prisma.insight.create({
    data: {
      user_id: student.id,
      month: currentMonth,
      summary_text:
        "Trong tháng 9/2026, tổng thu nhập của bạn đạt 7.500.000đ và tổng chi tiêu hiện tại là 3.319.000đ. Nhìn chung, bạn đang kiểm soát tốt ngân sách với tỷ lệ tiết kiệm đạt 55.7%. Tuy nhiên, chi tiêu cho danh mục 'Ăn uống ngoài' và giao đồ ăn có xu hướng tăng 38% so với tuần đầu tiên.",
      tip_text:
        "💡 Lời khuyên thiết thực: Bạn nên đặt hạn mức trần 350.000đ/tuần cho các đơn ship thức ăn công nghệ. Nấu ăn chung tại phòng trọ có thể giúp bạn tiết kiệm thêm ít nhất 600.000đ mỗi tháng!",
      is_pinned: true,
    },
  });

  // 8. Tạo các mẹo tiết kiệm thông minh (SRS 3.8)
  const tips = [
    {
      title: "Tận dụng gói cước sinh viên",
      content: "Các dịch vụ như Spotify, Apple Music, YouTube Premium đều có giá ưu đãi giảm 50% cho sinh viên (chỉ từ 29.000đ/tháng). Hãy xác thực email đuôi .edu để tiết kiệm ngay!",
      category_type: "Subscriptions",
      potential_saving: 80000,
      is_pinned: true,
    },
    {
      title: "Mua vé xe buýt tháng hoặc đi chung xe",
      content: "Chuyển sang dùng vé xe buýt tháng liên tuyến dành cho sinh viên chỉ 100.000đ/tháng thay vì đi xe máy hàng ngày có thể giúp bạn tiết kiệm tới 300.000đ tiền xăng và gửi xe.",
      category_type: "Transport",
      potential_saving: 300000,
      is_pinned: false,
    },
    {
      title: "Mua lại giáo trình cũ từ các anh chị khóa trên",
      content: "Thay vì mua sách giáo trình mới tại nhà sách, hãy tìm mua lại tại các hội nhóm sinh viên khóa trước hoặc mượn tại thư viện trường để tiết kiệm đến 70% chi phí.",
      category_type: "Academics",
      potential_saving: 250000,
      is_pinned: false,
    },
  ];

  for (const tip of tips) {
    await prisma.savingTip.create({
      data: {
        user_id: student.id,
        ...tip,
      },
    });
  }

  // 9. Tạo thông báo in-app mẫu (SRS 3.9)
  await prisma.notification.createMany({
    data: [
      {
        user_id: student.id,
        title: "Cảnh báo ngân sách Ăn uống",
        message: "Bạn đã chi tiêu 75% ngân sách danh mục 'Food' của tháng này (1.875.000đ / 2.500.000đ).",
        type: "warning",
      },
      {
        user_id: student.id,
        title: "AI Insight tháng mới",
        message: "Báo cáo phân tích tài chính tháng 9 của bạn đã sẵn sàng. Bấm vào để xem chi tiết lời khuyên từ AI!",
        type: "info",
      },
    ],
  });

  console.log("🎉 NẠP DỮ LIỆU SEED DATA HOÀN TẤT 100%!");
}

main()
  .catch((e) => {
    console.error("❌ Lỗi khi nạp dữ liệu mẫu:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
