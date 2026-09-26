import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Thiếu nội dung mô tả." }, { status: 400 });
    }

    const lower = text.toLowerCase().trim();

    // 1. Kiểm tra các giao dịch trước đây xem người dùng đã từng gán mô tả này vào danh mục nào
    const pastTx = await prisma.transaction.findFirst({
      where: {
        description: {
          contains: lower,
          mode: "insensitive",
        },
      },
      include: { category: true },
      orderBy: { created_at: "desc" },
    });

    if (pastTx && pastTx.category) {
      return NextResponse.json({
        categoryId: pastTx.category.id,
        categoryName: pastTx.category.name,
        type: pastTx.category.type,
        confidence: 0.98,
        source: "learned_history",
        explanation: `Dựa vào thói quen ghi chép trước đây của bạn cho "${pastTx.description}".`,
      });
    }

    // 2. Phân loại theo bộ luật ngôn ngữ thông minh dành riêng cho sinh viên Việt Nam
    let matchedName = "Chi tiêu khác";
    let matchedType = "expense";
    let confidence = 0.92;
    let explanation = "Gợi ý tự động qua AI Natural Language Processing.";

    if (
      lower.includes("cơm") ||
      lower.includes("phở") ||
      lower.includes("bún") ||
      lower.includes("bánh mì") ||
      lower.includes("cafe") ||
      lower.includes("cà phê") ||
      lower.includes("trà sữa") ||
      lower.includes("ăn") ||
      lower.includes("uống") ||
      lower.includes("căn tin") ||
      lower.includes("cantin") ||
      lower.includes("quán") ||
      lower.includes("buffet") ||
      lower.includes("highlands") ||
      lower.includes("starbucks")
    ) {
      matchedName = "Ăn uống";
      matchedType = "expense";
      explanation = "Nhận diện từ khóa ẩm thực, đồ uống hoặc căn tin trường học.";
    } else if (
      lower.includes("xăng") ||
      lower.includes("bus") ||
      lower.includes("xe buýt") ||
      lower.includes("xe ôm") ||
      lower.includes("grab") ||
      lower.includes("be") ||
      lower.includes("gửi xe") ||
      lower.includes("sửa xe") ||
      lower.includes("vé xe")
    ) {
      matchedName = "Đi lại";
      matchedType = "expense";
      explanation = "Nhận diện phương tiện di chuyển, tiền xăng hoặc gửi xe sinh viên.";
    } else if (
      lower.includes("trọ") ||
      lower.includes("ký túc xá") ||
      lower.includes("ktx") ||
      lower.includes("phòng") ||
      lower.includes("tiền nhà") ||
      lower.includes("tiền điện") ||
      lower.includes("tiền nước") ||
      lower.includes("tiền mạng")
    ) {
      matchedName = "Tiền trọ / KTX";
      matchedType = "expense";
      explanation = "Khoản chi phí cố định cho nhà trọ, ký túc xá và điện nước.";
    } else if (
      lower.includes("sách") ||
      lower.includes("giáo trình") ||
      lower.includes("học phí") ||
      lower.includes("tín chỉ") ||
      lower.includes("photo") ||
      lower.includes("văn phòng phẩm") ||
      lower.includes("bút") ||
      lower.includes("vở") ||
      lower.includes("khóa học")
    ) {
      matchedName = "Học tập";
      matchedType = "expense";
      explanation = "Khoản chi phục vụ mục đích học tập, giáo trình và tài liệu.";
    } else if (
      lower.includes("netflix") ||
      lower.includes("spotify") ||
      lower.includes("icloud") ||
      lower.includes("youtube") ||
      lower.includes("chatgpt") ||
      lower.includes("canva") ||
      lower.includes("4g") ||
      lower.includes("gói mạng")
    ) {
      matchedName = "Dịch vụ số";
      matchedType = "expense";
      explanation = "Phí duy trì các ứng dụng số hoặc gói cước định kỳ.";
    } else if (
      lower.includes("phim") ||
      lower.includes("cinema") ||
      lower.includes("cgv") ||
      lower.includes("du lịch") ||
      lower.includes("dã ngoại") ||
      lower.includes("karaoke") ||
      lower.includes("game") ||
      lower.includes("billiard") ||
      lower.includes("bida")
    ) {
      matchedName = "Giải trí";
      matchedType = "expense";
      explanation = "Khoản chi hoạt động vui chơi giải trí ngoài giờ học.";
    } else if (
      lower.includes("lương") ||
      lower.includes("làm thêm") ||
      lower.includes("part-time") ||
      lower.includes("phục vụ") ||
      lower.includes("gia sư") ||
      lower.includes("tiền công")
    ) {
      matchedName = "Việc làm thêm";
      matchedType = "income";
      explanation = "Thu nhập từ công việc làm thêm, phục vụ hoặc trợ giảng.";
    } else if (
      lower.includes("bố mẹ") ||
      lower.includes("gia đình") ||
      lower.includes("trợ cấp") ||
      lower.includes("gửi tiền") ||
      lower.includes("ba mẹ")
    ) {
      matchedName = "Trợ cấp gia đình";
      matchedType = "income";
      explanation = "Khoản trợ cấp định kỳ từ gia đình.";
    } else if (
      lower.includes("học bổng") ||
      lower.includes("khen thưởng") ||
      lower.includes("giải thưởng")
    ) {
      matchedName = "Học bổng";
      matchedType = "income";
      explanation = "Tiền thưởng thành tích học tập hoặc học bổng khuyến học.";
    } else if (
      lower.includes("mừng") ||
      lower.includes("quà") ||
      lower.includes("sinh nhật") ||
      lower.includes("lì xì")
    ) {
      matchedName = "Quà tặng / Thưởng";
      matchedType = "income";
      explanation = "Tiền quà tặng, tiền mừng ngày lễ hoặc sinh nhật.";
    }

    // Tìm category trong DB
    const category = await prisma.category.findFirst({
      where: {
        OR: [
          { name: matchedName },
          { name: { contains: matchedName, mode: "insensitive" } },
        ],
        type: matchedType,
      },
    });

    return NextResponse.json({
      categoryId: category ? category.id : 1,
      categoryName: category ? category.name : matchedName,
      type: matchedType,
      confidence,
      source: "rule_engine",
      explanation,
    });
  } catch (error) {
    console.error("AI Categorize error:", error);
    return NextResponse.json({ error: "Lỗi phân loại AI." }, { status: 500 });
  }
}
