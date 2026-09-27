/**
 * Smart categorization dạng rule-based, không dùng LLM.
 * Thứ tự ưu tiên (thực hiện ở category.service): lựa chọn trước đây của chính user → lịch sử của chính user
 * → từ khóa thương hiệu/merchant → danh mục mặc định.
 */

export type CanonicalCategory =
  | "food"
  | "transport"
  | "housing"
  | "education"
  | "subscriptions"
  | "entertainment"
  | "shopping"
  | "other_expense"
  | "allowance"
  | "part_time"
  | "scholarship"
  | "gift"
  | "other_income";

/** Tên danh mục mặc định (đã chuẩn hóa) tương ứng với từng nhóm. */
export const CANONICAL_CATEGORY_NAMES: Record<CanonicalCategory, string> = {
  food: "an uong",
  transport: "di lai",
  housing: "tien tro ktx",
  education: "hoc tap",
  subscriptions: "dich vu so",
  entertainment: "giai tri",
  shopping: "mua sam",
  other_expense: "chi tieu khac",
  allowance: "tro cap gia dinh",
  part_time: "viec lam them",
  scholarship: "hoc bong",
  gift: "qua tang thuong",
  other_income: "thu nhap khac",
};

export const CANONICAL_TYPE: Record<CanonicalCategory, "income" | "expense"> = {
  food: "expense",
  transport: "expense",
  housing: "expense",
  education: "expense",
  subscriptions: "expense",
  entertainment: "expense",
  shopping: "expense",
  other_expense: "expense",
  allowance: "income",
  part_time: "income",
  scholarship: "income",
  gift: "income",
  other_income: "income",
};

const RULES: Record<Exclude<CanonicalCategory, "other_expense" | "other_income">, string[]> = {
  food: [
    "com", "pho", "bun", "mi", "banh mi", "chao", "lau", "nuong", "cafe", "ca phe", "coffee", "tra sua",
    "tra chanh", "sinh to", "an sang", "an trua", "an toi", "an vat", "do an", "nuoc uong", "can tin",
    "cantin", "buffet", "highlands", "starbucks", "phuc long", "coffee house", "katinat", "grabfood",
    "grab food", "shopeefood", "shopee food", "baemin", "gofood", "kfc", "lotteria", "jollibee",
    "mcdonald", "pizza", "bach hoa xanh", "winmart", "circle k", "di cho",
  ],
  transport: [
    "xang", "do xang", "xe buyt", "bus", "xe om", "grab", "grab bike", "grabbike", "grab car", "grabcar",
    "be bike", "bebike", "be car", "xanh sm", "gojek", "gui xe", "sua xe", "ve xe", "ve tau", "taxi",
    "metro", "ve may bay",
  ],
  housing: [
    "tro", "tien tro", "phong tro", "ky tuc xa", "ktx", "tien nha", "tien phong", "tien dien", "tien nuoc",
    "dien nuoc", "internet", "wifi",
  ],
  education: [
    "sach", "giao trinh", "hoc phi", "tin chi", "photo", "in tai lieu", "van phong pham", "khoa hoc",
    "udemy", "coursera", "ielts", "toeic", "le phi thi",
  ],
  subscriptions: [
    "netflix", "spotify", "icloud", "youtube", "youtube premium", "chatgpt", "canva", "google one",
    "apple music", "4g", "goi cuoc", "nap dien thoai", "the cao",
  ],
  entertainment: [
    "phim", "xem phim", "cinema", "cgv", "lotte cinema", "bhd", "galaxy", "du lich", "da ngoai", "karaoke",
    "game", "steam", "billiard", "bida", "concert", "ve xem", "liveshow",
  ],
  shopping: [
    "shopee", "lazada", "tiki", "tiktok shop", "quan ao", "ao", "giay", "my pham", "uniqlo", "mua sam",
  ],
  allowance: ["tro cap", "tien tro cap", "bo me", "ba me", "gia dinh", "me gui", "bo gui", "tien nha gui"],
  part_time: ["luong", "lam them", "part time", "gia su", "tien cong", "freelance", "thuc tap"],
  scholarship: ["hoc bong", "khen thuong", "giai thuong"],
  gift: ["qua tang", "tien mung", "mung tuoi", "li xi", "lixi", "sinh nhat"],
};

/** Chữ thường, bỏ dấu tiếng Việt, bỏ ký tự đặc biệt: "Cà phê Highlands!" → "ca phe highlands". */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Khóa ghi nhớ lựa chọn của user: hai từ đầu tiên của mô tả (thường là tên quán/merchant). */
export function preferenceKey(description: string): string {
  return normalizeText(description).split(" ").slice(0, 2).join(" ");
}

export interface RuleMatch {
  category: CanonicalCategory;
  keyword: string;
}

/** Khớp theo ranh giới từ; nếu nhiều từ khóa cùng khớp, từ khóa dài nhất (cụ thể nhất) thắng. */
export function matchRule(text: string, type?: "income" | "expense"): RuleMatch | null {
  const haystack = ` ${normalizeText(text)} `;
  let best: RuleMatch | null = null;

  for (const [category, keywords] of Object.entries(RULES) as [CanonicalCategory, string[]][]) {
    if (type && CANONICAL_TYPE[category] !== type) continue;
    for (const keyword of keywords) {
      if (haystack.includes(` ${keyword} `) && (!best || keyword.length > best.keyword.length)) {
        best = { category, keyword };
      }
    }
  }
  return best;
}

export function fallbackCategory(type: "income" | "expense"): CanonicalCategory {
  return type === "income" ? "other_income" : "other_expense";
}
