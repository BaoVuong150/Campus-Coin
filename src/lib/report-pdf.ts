import type { jsPDF as JsPDF } from "jspdf";
import { formatDate } from "@/lib/utils/date";
import { formatPercent, formatVND } from "@/lib/utils/money";
import type { Messages } from "@/i18n";
import type { Formatters } from "@/i18n/format";
import type { ReportDTO } from "@/types/finance";

/** Màu in cố định (PDF luôn nền trắng, không phụ thuộc theme). */
const INK = "#0b1716";
const MUTED = "#56686a";
const LINE = "#e3eceb";
const PRIMARY = "#2dd4bf";
const PRIMARY_INK = "#042f2e";
const INCOME = "#0d9488";
const EXPENSE = "#e5484d";
const SERIES = ["#2a78d6", "#eb6834", "#0f9f94", "#eda100", "#e87ba4", "#4d7c0f", "#4a3aa7", "#e34948"];

const PAGE_W = 210;
const PAGE_H = 297;
const M = 16;
const CONTENT_W = PAGE_W - M * 2;
const FONT = "BeVietnamPro";

async function loadFont(url: string): Promise<string> {
  const buffer = await (await fetch(url)).arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  return btoa(binary);
}

/**
 * Tập lệnh vẽ tối thiểu mà bố cục báo cáo dùng (đơn vị mm). jsPDF đáp ứng sẵn; bản xuất ảnh PNG dùng
 * CanvasSurface cùng giao diện nên PDF và ảnh có bố cục giống hệt nhau mà không phải vẽ lại hai lần.
 */
export interface DrawSurface {
  setFont(name: string, weight: string): unknown;
  setFontSize(size: number): unknown;
  setTextColor(color: string): unknown;
  setFillColor(color: string): unknown;
  setDrawColor(color: string): unknown;
  setLineWidth(width: number): unknown;
  text(text: string, x: number, y: number, options?: { align?: "left" | "center" | "right" }): unknown;
  line(x1: number, y1: number, x2: number, y2: number): unknown;
  rect(x: number, y: number, w: number, h: number, style?: string): unknown;
  roundedRect(x: number, y: number, w: number, h: number, rx: number, ry: number, style?: string): unknown;
  splitTextToSize(text: string, maxWidth: number): string[];
  addPage(): unknown;
}

class Writer {
  y = M;
  constructor(
    public doc: DrawSurface,
    public t: Messages,
    public fmt: Formatters,
    /** false: một trang dài liên tục (ảnh PNG) – không ngắt trang. */
    private paged = true
  ) {}

  font(weight: "normal" | "bold", size: number, color = INK) {
    this.doc.setFont(FONT, weight);
    this.doc.setFontSize(size);
    this.doc.setTextColor(color);
  }

  ensure(height: number) {
    if (this.paged && this.y + height > PAGE_H - M - 8) {
      this.doc.addPage();
      this.y = M;
    }
  }

  heading(text: string) {
    this.ensure(14);
    this.y += 4;
    this.font("bold", 12);
    this.doc.text(text, M, this.y);
    this.y += 3;
    this.doc.setDrawColor(LINE);
    this.doc.line(M, this.y, PAGE_W - M, this.y);
    this.y += 6;
  }
}

function header(w: Writer, report: ReportDTO, userName: string) {
  const { doc, t, fmt } = w;
  doc.setFillColor(PRIMARY);
  doc.roundedRect(M, M, 11, 11, 2.5, 2.5, "F");
  doc.setDrawColor(PRIMARY_INK);
  doc.setLineWidth(1.1);
  // Chữ C của logo: cung tròn vẽ bằng nhiều đoạn thẳng ngắn.
  const cx = M + 5.5;
  const cy = M + 5.5;
  let prev: [number, number] | null = null;
  for (let a = 40; a <= 320; a += 10) {
    const rad = (a * Math.PI) / 180;
    const point: [number, number] = [cx + 2.8 * Math.cos(rad), cy - 2.8 * Math.sin(rad)];
    if (prev) doc.line(prev[0], prev[1], point[0], point[1]);
    prev = point;
  }
  doc.setLineWidth(0.2);

  w.font("bold", 13);
  doc.text("Campus Coin", M + 14, M + 4.5);
  w.font("normal", 8.5, MUTED);
  doc.text(t.brand.subtitle, M + 14, M + 9);

  w.font("bold", 10);
  doc.text(t.pdf.title, PAGE_W - M, M + 3.5, { align: "right" });
  w.font("normal", 8.5, MUTED);
  doc.text(`${userName} · ${reportLabel(report, t, fmt)}`, PAGE_W - M, M + 8, { align: "right" });
  doc.text(`${formatDate(report.from)} – ${formatDate(report.to)} · ${t.pdf.exportedOn(formatDate(new Date()))}`, PAGE_W - M, M + 12, { align: "right" });

  w.y = M + 18;
  doc.setDrawColor(LINE);
  doc.line(M, w.y, PAGE_W - M, w.y);
  w.y += 6;
}

function kpis(w: Writer, report: ReportDTO) {
  const { t } = w;
  const items = [
    [t.pdf.income, formatVND(report.totals.income)],
    [t.pdf.expense, formatVND(report.totals.expense)],
    [t.pdf.net, `${report.totals.net < 0 ? "−" : ""}${formatVND(Math.abs(report.totals.net))}`],
    [t.pdf.avgDaily, formatVND(report.totals.averageDailySpend)],
  ];
  const gap = 3;
  const boxW = (CONTENT_W - gap * (items.length - 1)) / items.length;
  items.forEach(([label, value], i) => {
    const x = M + i * (boxW + gap);
    w.doc.setDrawColor(LINE);
    w.doc.roundedRect(x, w.y, boxW, 17, 2, 2, "S");
    w.font("normal", 8, MUTED);
    w.doc.text(label, x + 3.5, w.y + 6);
    w.font("bold", 11);
    w.doc.text(value, x + 3.5, w.y + 12.5);
  });
  w.y += 21;
  w.font("normal", 8.5, MUTED);
  w.doc.text(t.pdf.transactionCount(report.totals.transactionCount), M, w.y);
  w.y += 4;
}

function trendChart(w: Writer, report: ReportDTO) {
  const data = report.trend;
  if (data.every((d) => d.income === 0 && d.expense === 0)) return;
  w.heading(w.t.pdf.trend);
  const chartH = 52;
  w.ensure(chartH + 12);
  const { doc } = w;
  const top = w.y;
  const left = M + 14;
  const width = CONTENT_W - 14;
  const max = Math.max(...data.map((d) => Math.max(d.income, d.expense)), 1);

  doc.setDrawColor(LINE);
  w.font("normal", 7, MUTED);
  for (let i = 0; i <= 4; i++) {
    const y = top + chartH - (chartH * i) / 4;
    doc.line(left, y, left + width, y);
    doc.text(w.fmt.compact((max * i) / 4), left - 2, y + 1, { align: "right" });
  }

  const slot = width / data.length;
  const barW = Math.min(6, (slot * 0.7) / 2);
  const labelEvery = Math.ceil(data.length / 12);
  data.forEach((d, i) => {
    const x = left + i * slot + slot / 2;
    const hIn = (d.income / max) * chartH;
    const hEx = (d.expense / max) * chartH;
    doc.setFillColor(INCOME);
    if (hIn > 0) doc.rect(x - barW, top + chartH - hIn, barW - 0.3, hIn, "F");
    doc.setFillColor(EXPENSE);
    if (hEx > 0) doc.rect(x + 0.3, top + chartH - hEx, barW - 0.3, hEx, "F");
    if (i % labelEvery === 0) doc.text(w.fmt.bucket(d.key), x, top + chartH + 4, { align: "center" });
  });

  w.y = top + chartH + 9;
  const legend = (x: number, color: string, text: string) => {
    doc.setFillColor(color);
    doc.rect(x, w.y - 2.4, 2.8, 2.8, "F");
    w.font("normal", 8, MUTED);
    doc.text(text, x + 4, w.y);
  };
  legend(left, INCOME, w.t.pdf.income);
  legend(left + 24, EXPENSE, w.t.pdf.expense);
  w.y += 5;
}

function categoryTable(w: Writer, report: ReportDTO) {
  if (report.categories.length === 0) return;
  w.heading(w.t.pdf.categories);
  const { doc } = w;
  const barX = M + 62;
  const barW = CONTENT_W - 62 - 50;
  report.categories.slice(0, 10).forEach((c, i) => {
    w.ensure(7);
    const color = SERIES[i % SERIES.length];
    doc.setFillColor(color);
    doc.rect(M, w.y - 2.6, 2.8, 2.8, "F");
    w.font("normal", 9);
    doc.text(w.fmt.category(c.name), M + 5, w.y);
    doc.setFillColor("#f2f4f3");
    doc.rect(barX, w.y - 2.6, barW, 3, "F");
    doc.setFillColor(color);
    doc.rect(barX, w.y - 2.6, (barW * c.percentage) / 100, 3, "F");
    doc.text(formatPercent(c.percentage, 0), barX + barW + 12, w.y, { align: "right" });
    w.font("bold", 9);
    doc.text(formatVND(c.amount), PAGE_W - M, w.y, { align: "right" });
    w.y += 7;
  });
}

function largestTable(w: Writer, report: ReportDTO) {
  if (report.largestTransactions.length === 0) return;
  w.heading(w.t.pdf.largest);
  report.largestTransactions.forEach((t) => {
    w.ensure(7);
    w.font("normal", 9, MUTED);
    w.doc.text(formatDate(t.date), M, w.y);
    w.font("normal", 9);
    w.doc.text(w.doc.splitTextToSize(t.description, 90)[0] as string, M + 24, w.y);
    w.font("normal", 9, MUTED);
    w.doc.text(w.fmt.category(t.category.name), M + 118, w.y);
    w.font("bold", 9);
    w.doc.text(formatVND(t.amount), PAGE_W - M, w.y, { align: "right" });
    w.y += 7;
  });
}

function budgetTable(w: Writer, report: ReportDTO) {
  if (report.budgetPerformance.length === 0) return;
  w.heading(w.t.pdf.budgets);
  report.budgetPerformance.forEach((b) => {
    w.ensure(7);
    w.font("normal", 9);
    w.doc.text(w.fmt.category(b.categoryName), M, w.y);
    w.font("normal", 9, MUTED);
    w.doc.text(`${formatVND(b.spent)} / ${formatVND(b.limit)}`, M + 110, w.y, { align: "right" });
    w.font("bold", 9, b.percentage > 100 ? EXPENSE : INK);
    w.doc.text(`${b.percentage}%${b.percentage > 100 ? w.t.pdf.exceeded : ""}`, PAGE_W - M, w.y, { align: "right" });
    w.y += 7;
  });
}

function footer(doc: JsPDF, t: Messages) {
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont(FONT, "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(MUTED);
    doc.text(t.pdf.footer, M, PAGE_H - 8);
    doc.text(t.pdf.page(i, pages), PAGE_W - M, PAGE_H - 8, { align: "right" });
  }
}

/** Nhãn kỳ báo cáo: tháng/quý/năm, hoặc khoảng ngày tùy chọn khi báo cáo được lọc theo ngày. */
function reportLabel(report: ReportDTO, t: Messages, fmt: Formatters): string {
  return report.custom ? t.reports.filters.custom(formatDate(report.from), formatDate(report.to)) : fmt.period(report.period, report.anchor);
}

/** Vẽ toàn bộ nội dung báo cáo lên bề mặt; trả về vị trí y cuối cùng (mm). */
function drawReport(w: Writer, report: ReportDTO, userName: string): number {
  header(w, report, userName);
  kpis(w, report);
  trendChart(w, report);
  categoryTable(w, report);
  largestTable(w, report);
  budgetTable(w, report);
  return w.y;
}

const fileBase = (t: Messages, label: string) => `${t.pdf.fileName}-${label.replace(/[^\p{L}\p{N}]+/gu, "-")}`;

/** Dựng PDF báo cáo từ dữ liệu (không chụp màn hình): chữ tiếng Việt dạng vector, biểu đồ vẽ bằng hình khối. */
export async function exportReportPdf(report: ReportDTO, userName: string, t: Messages, fmt: Formatters): Promise<void> {
  const [{ jsPDF }, regular, bold] = await Promise.all([
    import("jspdf"),
    loadFont("/fonts/BeVietnamPro-Regular.ttf"),
    loadFont("/fonts/BeVietnamPro-SemiBold.ttf"),
  ]);
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  doc.addFileToVFS("BeVietnamPro-Regular.ttf", regular);
  doc.addFont("BeVietnamPro-Regular.ttf", FONT, "normal");
  doc.addFileToVFS("BeVietnamPro-SemiBold.ttf", bold);
  doc.addFont("BeVietnamPro-SemiBold.ttf", FONT, "bold");
  const label = reportLabel(report, t, fmt);
  doc.setProperties({ title: `Campus Coin – ${label}`, author: userName });

  drawReport(new Writer(doc, t, fmt), report, userName);
  footer(doc, t);
  doc.save(`${fileBase(t, label)}.pdf`);
}

/** Độ phân giải ảnh: 7 px/mm → rộng 1470 px (đủ nét khi in hoặc xem trên điện thoại). */
const PX_PER_MM = 7;
/** jsPDF tính cỡ chữ theo point; 1 pt = 0.3528 mm. */
const PT_TO_MM = 0.3528;

/** Vẽ lệnh DrawSurface lên canvas 2D (đơn vị mm → px). */
class CanvasSurface implements DrawSurface {
  private weight = "400";
  private size = 10;
  private textColor = INK;
  private fillColor = INK;
  private drawColor = INK;
  private lineWidth = 0.2;

  constructor(private ctx: CanvasRenderingContext2D) {}

  private applyFont() {
    this.ctx.font = `${this.weight} ${this.size * PT_TO_MM * PX_PER_MM}px ${FONT}`;
  }
  setFont(_name: string, weight: string) {
    this.weight = weight === "bold" ? "600" : "400";
  }
  setFontSize(size: number) {
    this.size = size;
  }
  setTextColor(color: string) {
    this.textColor = color;
  }
  setFillColor(color: string) {
    this.fillColor = color;
  }
  setDrawColor(color: string) {
    this.drawColor = color;
  }
  setLineWidth(width: number) {
    this.lineWidth = width;
  }
  text(text: string, x: number, y: number, options?: { align?: "left" | "center" | "right" }) {
    this.applyFont();
    this.ctx.fillStyle = this.textColor;
    this.ctx.textAlign = options?.align ?? "left";
    this.ctx.textBaseline = "alphabetic";
    this.ctx.fillText(text, x * PX_PER_MM, y * PX_PER_MM);
  }
  line(x1: number, y1: number, x2: number, y2: number) {
    this.ctx.strokeStyle = this.drawColor;
    this.ctx.lineWidth = this.lineWidth * PX_PER_MM;
    this.ctx.beginPath();
    this.ctx.moveTo(x1 * PX_PER_MM, y1 * PX_PER_MM);
    this.ctx.lineTo(x2 * PX_PER_MM, y2 * PX_PER_MM);
    this.ctx.stroke();
  }
  rect(x: number, y: number, w: number, h: number, style = "S") {
    this.roundedRect(x, y, w, h, 0, 0, style);
  }
  roundedRect(x: number, y: number, w: number, h: number, rx: number, _ry: number, style = "S") {
    this.ctx.beginPath();
    this.ctx.roundRect(x * PX_PER_MM, y * PX_PER_MM, w * PX_PER_MM, h * PX_PER_MM, rx * PX_PER_MM);
    if (style.includes("F")) {
      this.ctx.fillStyle = this.fillColor;
      this.ctx.fill();
    }
    if (style.includes("S") || style === "D") {
      this.ctx.strokeStyle = this.drawColor;
      this.ctx.lineWidth = this.lineWidth * PX_PER_MM;
      this.ctx.stroke();
    }
  }
  splitTextToSize(text: string, maxWidth: number): string[] {
    this.applyFont();
    const lines: string[] = [];
    let current = "";
    for (const word of text.split(/\s+/)) {
      const next = current ? `${current} ${word}` : word;
      if (current && this.ctx.measureText(next).width > maxWidth * PX_PER_MM) {
        lines.push(current);
        current = word;
      } else current = next;
    }
    return current ? [...lines, current] : lines;
  }
  addPage() {
    // Ảnh là một trang dài liên tục (Writer không ngắt trang khi paged = false).
  }
}

/** Nạp font Be Vietnam Pro cho canvas (chữ tiếng Việt hiển thị đúng dấu, giống bản PDF). */
async function loadCanvasFonts() {
  const faces = [
    new FontFace(FONT, "url(/fonts/BeVietnamPro-Regular.ttf)", { weight: "400" }),
    new FontFace(FONT, "url(/fonts/BeVietnamPro-SemiBold.ttf)", { weight: "600" }),
  ];
  for (const face of await Promise.all(faces.map((f) => f.load()))) document.fonts.add(face);
}

/** Xuất báo cáo thành ảnh PNG (SRS 3.6: "export as PDF or Image") – cùng bố cục với PDF, nền trắng. */
export async function exportReportImage(report: ReportDTO, userName: string, t: Messages, fmt: Formatters): Promise<void> {
  await loadCanvasFonts();
  // Lượt 1: đo chiều cao nội dung trên canvas nháp; lượt 2: vẽ thật lên canvas đúng kích thước.
  const scratch = document.createElement("canvas").getContext("2d");
  if (!scratch) throw new Error("Canvas 2D is not supported");
  const height = drawReport(new Writer(new CanvasSurface(scratch), t, fmt, false), report, userName) + 12;

  const canvas = document.createElement("canvas");
  canvas.width = PAGE_W * PX_PER_MM;
  canvas.height = Math.ceil(height * PX_PER_MM);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D is not supported");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const surface = new CanvasSurface(ctx);
  drawReport(new Writer(surface, t, fmt, false), report, userName);
  surface.setFontSize(7.5);
  surface.setTextColor(MUTED);
  surface.text(t.pdf.footer, M, height - 5);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("PNG encoding failed");
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${fileBase(t, reportLabel(report, t, fmt))}.png`;
  link.click();
  // Giải phóng bộ nhớ sau khi trình duyệt đã bắt đầu tải file.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
