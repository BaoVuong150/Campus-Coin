/**
 * Đóng gói file ZIP nộp bài TechWiz từ commit hiện tại (HEAD):
 *   - toàn bộ mã nguồn đã commit (không có node_modules, .env, .next, coverage – vì chúng không nằm trong git);
 *   - database.sql + thư mục submission/ (ERD, từ điển dữ liệu, dữ liệu kiểm thử, tài khoản, hướng dẫn cài đặt);
 *   - các file nhóm tự làm đặt trong submission/deliverables/ (video .mp4, ReadMe.doc, báo cáo dự án) –
 *     được thêm vào gốc file ZIP, không commit vào git.
 *
 * Chạy:  node scripts/package-submission.mjs "<TÊN_FILE_THEO_QUY_ĐỊNH>"
 *        thêm --draft để đóng gói thử khi chưa có đủ video/báo cáo, --allow-dirty để bỏ qua kiểm tra thay đổi chưa commit.
 * Kết quả: dist-submission/<TÊN_FILE>.zip
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const name = args.find((a) => !a.startsWith("--"));
const draft = args.includes("--draft");
const allowDirty = args.includes("--allow-dirty");

function fail(message) {
  console.error(`✖ ${message}`);
  process.exit(1);
}

if (!name) fail('Thiếu tên file. Ví dụ: node scripts/package-submission.mjs "TechWiz7_CampusCoin_TeamName"');
if (!/^[\w.\- ()]+$/.test(name) || name.endsWith(".zip")) fail("Tên file chỉ gồm chữ không dấu, số, khoảng trắng, . - _ ( ) và không kèm đuôi .zip");

const git = (...a) => execFileSync("git", a, { encoding: "utf8" }).trim();

// 1. Mã nguồn lấy từ HEAD → thay đổi chưa commit sẽ KHÔNG có trong ZIP.
if (!allowDirty && git("status", "--porcelain")) fail("Còn thay đổi chưa commit (git status). Commit trước hoặc chạy lại với --allow-dirty.");

// 2. Không bao giờ đóng gói secret.
const leaked = git("ls-files", "--", ".env", ".env.local", ".env.production").split("\n").filter(Boolean);
if (leaked.length) fail(`File bí mật đang được git theo dõi: ${leaked.join(", ")} – gỡ khỏi git trước khi nộp.`);

// 3. File do nhóm tự làm.
const deliverablesDir = path.join("submission", "deliverables");
const deliverables = existsSync(deliverablesDir)
  ? readdirSync(deliverablesDir)
      .filter((f) => f !== "README.md" && statSync(path.join(deliverablesDir, f)).isFile())
      .map((f) => path.join(deliverablesDir, f))
  : [];
const has = (re) => deliverables.some((f) => re.test(path.basename(f)));
const missing = [
  !has(/\.mp4$/i) && "video demo (.mp4)",
  !has(/^readme\.docx?$/i) && "ReadMe.doc (các giả định)",
  !has(/report|bao.?cao/i) && "báo cáo dự án (.doc/.docx/.pdf, tên có chữ 'report' hoặc 'bao cao')",
].filter(Boolean);
if (missing.length) {
  const message = `Thiếu trong ${deliverablesDir}/: ${missing.join("; ")}`;
  if (!draft) fail(`${message}\n  (dùng --draft để đóng gói thử)`);
  console.warn(`⚠ ${message} – đóng gói thử (--draft), CHƯA dùng để nộp.`);
}

// 4. Tạo ZIP: mọi thứ nằm trong một thư mục gốc cùng tên file.
mkdirSync("dist-submission", { recursive: true });
const output = path.join("dist-submission", `${name}.zip`);
git(
  "archive",
  "--format=zip",
  `--prefix=${name}/`,
  ...deliverables.map((f) => `--add-file=${f}`),
  "-o",
  output,
  "HEAD"
);

const mb = (statSync(output).size / 1024 / 1024).toFixed(1);
console.log(`✔ Đã tạo ${output} (${mb} MB) từ commit ${git("rev-parse", "--short", "HEAD")}`);
for (const f of deliverables) console.log(`  + ${path.basename(f)}`);
