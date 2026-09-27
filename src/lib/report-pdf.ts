import type { jsPDF as JsPDF } from "jspdf";
import { formatDate } from "@/lib/utils/date";
import { formatPercent, formatVND } from "@/lib/utils/money";
import type { Messages } from "@/i18n";
import type { Formatters } from "@/i18n/format";
import type { ReportDTO } from "@/types/finance";

/** Màu in cố định (PDF luôn nền trắng, không phụ thuộc theme). */
const INK = "#101513";
const MUTED = "#4f5a55";
const LINE = "#e4e7e5";
const PRIMARY = "#2dd4bf";
const PRIMARY_INK = "#042f2e";
const INCOME = "#0d9488";
const EXPENSE = "#e5484d";
const SERIES = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#4a3aa7", "#e34948"];

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

class Writer {
  y = M;
  constructor(
    public doc: JsPDF,
    public t: Messages,
    public fmt: Formatters
  ) {}

  font(weight: "normal" | "bold", size: number, color = INK) {
    this.doc.setFont(FONT, weight);
    this.doc.setFontSize(size);
    this.doc.setTextColor(color);
  }

  ensure(height: number) {
    if (this.y + height > PAGE_H - M - 8) {
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
  doc.text(`${userName} · ${fmt.period(report.period, report.anchor)}`, PAGE_W - M, M + 8, { align: "right" });
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
  const label = fmt.period(report.period, report.anchor);
  doc.setProperties({ title: `Campus Coin – ${label}`, author: userName });

  const w = new Writer(doc, t, fmt);
  header(w, report, userName);
  kpis(w, report);
  trendChart(w, report);
  categoryTable(w, report);
  largestTable(w, report);
  budgetTable(w, report);
  footer(doc, t);

  const safeLabel = label.replace(/[^\p{L}\p{N}]+/gu, "-");
  doc.save(`${t.pdf.fileName}-${safeLabel}.pdf`);
}
