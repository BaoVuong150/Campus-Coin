import { normalizeText } from "@/lib/finance/categorize";

/**
 * Trợ lý hỗ trợ trong app (SRS 3.12 – "AI assistant bot"): nhận diện ý định câu hỏi bằng từ khóa,
 * không gọi LLM bên ngoài nên luôn chạy được, không lộ dữ liệu tài chính ra dịch vụ thứ ba.
 * Câu hỏi về số liệu được trả lời từ chính API của user; câu hỏi "làm thế nào" trả lời kèm link tới trang liên quan.
 */
export type AssistantIntent =
  | "balance"
  | "safeToSpend"
  | "topCategory"
  | "budget"
  | "addTransaction"
  | "importCsv"
  | "recurring"
  | "reports"
  | "tips"
  | "goals"
  | "password"
  | "appearance"
  | "greeting";

/** Từ khóa đã chuẩn hóa (không dấu, chữ thường), cả tiếng Việt và tiếng Anh. Thứ tự = ưu tiên khi bằng điểm. */
const KEYWORDS: [AssistantIntent, string[]][] = [
  ["safeToSpend", ["chi duoc", "tieu duoc", "duoc chi", "duoc tieu", "moi ngay", "hom nay", "safe to spend", "today", "per day", "daily", "can spend", "can i spend"]],
  ["balance", ["so du", "con bao nhieu", "chi bao nhieu", "tieu bao nhieu", "thu bao nhieu", "con lai", "thu chi", "tong thu", "tong chi", "balance", "left", "income", "spent", "spend", "spending", "how much"]],
  ["topCategory", ["nhieu nhat", "top", "danh muc", "khoan nao", "most", "category", "biggest"]],
  ["budget", ["ngan sach", "han muc", "vuot", "budget", "limit", "over"]],
  ["importCsv", ["csv", "import", "nhap file", "nhap hang loat", "excel"]],
  ["addTransaction", ["them giao dich", "ghi chep", "nhap giao dich", "them khoan", "add", "log", "new transaction", "record"]],
  ["recurring", ["dinh ky", "hang thang", "tu dong", "recurring", "monthly", "subscription"]],
  ["reports", ["bao cao", "xuat", "pdf", "email", "thong ke", "bieu do", "report", "export", "chart"]],
  ["tips", ["meo", "tiet kiem", "nhan dinh", "goi y", "tip", "tips", "save", "saving", "insight", "advice"]],
  ["goals", ["muc tieu", "quy", "goal", "goals", "fund"]],
  ["password", ["mat khau", "quen", "dang nhap", "password", "forgot", "login"]],
  ["appearance", ["giao dien", "che do toi", "dark", "sang", "co chu", "font", "ngon ngu", "language", "theme", "light"]],
  ["greeting", ["xin chao", "chao", "hello", "hi", "hey", "alo"]],
];

/** Ý định khớp nhiều từ khóa nhất (từ khóa dài được tính nặng hơn); null khi không nhận ra. */
export function detectIntent(question: string): AssistantIntent | null {
  const text = ` ${normalizeText(question)} `;
  if (!text.trim()) return null;
  let best: AssistantIntent | null = null;
  let bestScore = 0;
  for (const [intent, words] of KEYWORDS) {
    const score = words.reduce((sum, w) => (text.includes(` ${w} `) ? sum + w.split(" ").length : sum), 0);
    if (score > bestScore) {
      best = intent;
      bestScore = score;
    }
  }
  return best;
}

/** Ý định cần số liệu của user (gọi API); còn lại là câu trả lời hướng dẫn tĩnh. */
export const DATA_INTENTS = new Set<AssistantIntent>(["balance", "safeToSpend", "topCategory", "budget"]);

/** Trang liên quan cho từng ý định – hiển thị thành nút "Mở trang". */
export const INTENT_LINKS: Partial<Record<AssistantIntent, string>> = {
  balance: "/dashboard",
  safeToSpend: "/dashboard",
  topCategory: "/reports",
  budget: "/budgets",
  importCsv: "/transactions",
  recurring: "/recurring",
  reports: "/reports",
  tips: "/dashboard",
  goals: "/goals",
  password: "/settings",
  appearance: "/settings",
};
