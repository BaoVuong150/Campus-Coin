import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Chưa đăng nhập." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month") || "2026-09";

    // Lấy Insight đã lưu trong DB cho tháng này (nếu có)
    const existingInsight = await prisma.insight.findFirst({
      where: {
        user_id: user.userId,
        month,
      },
    });

    // Lấy danh sách mẹo tiết kiệm
    const savingTips = await prisma.savingTip.findMany({
      where: {
        OR: [
          { user_id: user.userId },
          { user_id: null },
        ],
        is_dismissed: false,
      },
      orderBy: [{ is_pinned: "desc" }, { potential_saving: "desc" }],
      take: 4,
    });

    // Nếu đã có insight, trả về ngay
    if (existingInsight) {
      return NextResponse.json({
        insight: existingInsight,
        savingTips,
      });
    }

    // Nếu chưa có, phân tích tức thời từ giao dịch trong tháng
    const [year, m] = month.split("-").map(Number);
    const startOfMonth = new Date(Date.UTC(year, m - 1, 1, 0, 0, 0));
    const endOfMonth = new Date(Date.UTC(year, m, 0, 23, 59, 59, 999));

    const transactions = await prisma.transaction.findMany({
      where: {
        user_id: user.userId,
        date: { gte: startOfMonth, lte: endOfMonth },
      },
      include: { category: true },
    });

    let totalExpense = 0;
    let foodExpense = 0;
    let transportExpense = 0;

    transactions.forEach((tx) => {
      const amt = Number(tx.amount);
      if (tx.type === "expense") {
        totalExpense += amt;
        if (tx.category.name === "Ăn uống" || tx.category.name === "Food") foodExpense += amt;
        if (tx.category.name === "Đi lại" || tx.category.name === "Transport") transportExpense += amt;
      }
    });

    const foodPercent = totalExpense > 0 ? Math.round((foodExpense / totalExpense) * 100) : 0;

    const summaryText = `Trong ${month}, bạn đã chi tiêu tổng cộng ${totalExpense.toLocaleString("vi-VN")} đ. Trong đó, chi phí Ăn uống chiếm tỷ trọng cao nhất (${foodPercent}% tổng chi). So với mức trung bình sinh viên, bạn đang kiểm soát tốt các khoản đăng ký dịch vụ số, nhưng khoản ăn ngoài và cafe đang có xu hướng tăng nhẹ vào các ngày cuối tuần.`;

    const tipText = `Đặt hạn mức chi tiêu ăn uống tối đa 350.000 đ/tuần và nấu ăn tại phòng trọ 3 buổi/tuần sẽ giúp bạn giữ lại được ít nhất 650.000 đ để đạt mục tiêu tiết kiệm tháng!`;

    // Lưu vào DB để lần sau tải nhanh
    const newInsight = await prisma.insight.create({
      data: {
        user_id: user.userId,
        month,
        summary_text: summaryText,
        tip_text: tipText,
      },
    });

    return NextResponse.json({
      insight: newInsight,
      savingTips,
    });
  } catch (error) {
    console.error("AI Insights error:", error);
    return NextResponse.json({ error: "Lỗi tải AI insights." }, { status: 500 });
  }
}
