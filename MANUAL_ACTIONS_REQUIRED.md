# Manual actions required before the TechWiz submission

Everything that could be automated is done: code, tests, the SQL script, the ERD and data dictionary, test data, installation
guide, credentials, the video checklist and a ZIP packaging script (see `submission/README.md`).
This file lists **only** the steps that need a person (your accounts, recording, team-written documents, or your approval).

State on 2026-09-29: lint, typecheck, 255 tests, coverage and `npm run build` all pass. The live site
https://campus-coin-psi.vercel.app is up (`/api/health` = ok, both logins work), but it still runs commit `048ab9f`
and the database is missing the latest migration.

---

## BLOCKING SUBMISSION

### 1. Apply the pending database migration (≈ 2 min)
The live database is missing `20260929000000_admin_audit_constraints` (checked: `saving_tips.tip_key` and `admin_audits` do not exist).
Until it is applied, the dashboard saving-tips card, Admin → tip templates and insight history return errors.

1. Supabase Dashboard → your project → **Connect** (top bar) → **Connection string** → Method **Session pooler** → copy the URI
   (host `aws-0-ap-southeast-1.pooler.supabase.com`, port **5432** — not 6543).
2. In **Git Bash**:
   ```bash
   cd "/d/Aptech/Đồ Án/Campus-Coin"
   DATABASE_URL="<paste the 5432 URI, with [YOUR-PASSWORD] replaced>" npx prisma migrate deploy
   ```
3. Expected output: `Applying migration 20260929000000_admin_audit_constraints` … `All migrations have been successfully applied.`
   The migration only adds things; it deletes no data. Do **not** run `db push` or the seed against this database.

### 2. Commit and push the new code so Vercel redeploys (≈ 3 min)
The new features (report filters, weekly summary, image export, assistant, change history, next-month forecast, breadcrumbs,
recently viewed) exist only on this computer. Either reply **"commit và push"** and I will do it (without any Claude line), or in Git Bash:
```bash
git add -A
git commit -m "feat: complete SRS requirements and TechWiz submission package"
git push origin main
```
Then Vercel → project → **Deployments**: wait for the new deployment to show **Ready**, open https://campus-coin-psi.vercel.app,
sign in as the student and check that the round **bot button** (bottom-right) and **Reports → Export image** are there.

### 3. Record the demo video (.mp4) (≈ 30–45 min)
Required by the SRS ("MANDATORY"), and it must show every functional requirement.
1. Do this after steps 1–2 (and step 7 if you want to show the password-reset email on the live site).
2. Record with **Xbox Game Bar** (`Win + Alt + R` to start/stop; saves to `Videos\Captures`) or OBS Studio.
3. Follow `submission/FEATURE_CHECKLIST.md` from top to bottom and tick each line. Use `submission/test-data/sample-import.csv` for the CSV import.
4. Save it as `submission/deliverables/CampusCoin_Demo.mp4`.

### 4. Write the project report (team) (the longest task)
The SRS forbids fully AI-produced documentation, so the team writes it. It must **not** contain source code. Required sections and
the ready-made inputs to use:

| Section | Input you can use |
| --- | --- |
| Problem definition | SRS §1.1 (in your own words) |
| Design specifications | `DESIGN.md`, README §3 "Kiến trúc" |
| Flowcharts (login, add transaction + category suggestion, CSV import, budget alert, recurring job) | Draw in draw.io / Word |
| Data Flow Diagram (level 0 and level 1) | Draw in draw.io |
| Architecture diagram (browser → Next.js API → Prisma → PostgreSQL, Vercel Cron, Resend) | Draw in draw.io |
| ERD | Paste `submission/database/erd.mmd` into https://mermaid.live → **Actions → PNG** |
| Database design | `submission/database/data-dictionary.md` |
| Test data | `submission/test-data/TEST_DATA.md` |
| Installation instructions (**mandatory**) | `submission/INSTALLATION.md` |
| User credentials (**mandatory**) | `submission/CREDENTIALS.md` |
| Task allocation per member | Team |
| AI tools used (required by the SRS) | List every tool you used, e.g. Claude Code |

Save it as PDF/DOCX with "Report" in the name, e.g. `submission/deliverables/CampusCoin_Project_Report.pdf`.

### 5. Create ReadMe.doc (≈ 10 min)
1. Open `submission/ReadMe-assumptions-draft.md`, check every point and rewrite it in your own words. Add team name and members.
2. In Word: **File → Save As → Save as type: Word 97-2003 Document (*.doc)** → name `ReadMe.doc` → folder `submission/deliverables/`.

### 6. Confirm the ZIP name, build the ZIP and submit on time
Neither the SRS nor the evaluation PDF gives a file-naming rule, so ask your Aptech centre or check the TechWiz portal for the required name.
Then, after step 2 (the script packs the latest **commit**):
```bash
node scripts/package-submission.mjs "<EXACT_NAME_FROM_THE_PORTAL>"
```
It refuses to run while the video, ReadMe.doc or report is missing, or while there are uncommitted changes. Upload
`dist-submission/<EXACT_NAME_FROM_THE_PORTAL>.zip` (plus the hosted URL https://campus-coin-psi.vercel.app) before the deadline — on-time submission is worth 5 points.

---

## IMPORTANT BEFORE SUBMISSION

### 7. Turn on email in production (password reset + "Send report by email")
Checked: the live site answers "Forgot password" with `503 EMAIL_UNAVAILABLE` (email is not configured). `CRON_SECRET` is already set.
1. https://resend.com → sign up → **API Keys → Create API key** → copy `re_…`.
2. Vercel → project → **Settings → Environment Variables** → add for **Production**:
   - `RESEND_API_KEY` = `re_…`
   - `MAIL_FROM` = `Campus Coin <onboarding@resend.dev>` (or an address on a domain you verified in Resend → Domains)
   - `APP_URL` = `https://campus-coin-psi.vercel.app`
3. Vercel → **Deployments** → latest → **⋯ → Redeploy**.
4. Test: with `onboarding@resend.dev`, Resend delivers only to the email address of your Resend account. So register a new student
   with that email, sign out, use **Forgot password**, and open the link from your inbox.

If you skip this, record the password-reset part of the video locally instead: `npm run dev`, use Forgot password, then open the
newest `.html` file in the `.mail/` folder and click the link.

### 8. Browser and device check (evaluation: compatibility 5 pts + responsive UI)
Open the live site in **Chrome, Firefox, Edge and Opera**. In each: sign in as student, add a transaction, open Reports, export PDF and image,
toggle dark mode, sign out. In Chrome press `F12 → Ctrl+Shift+M` and try iPhone SE, iPad and a 1920 px screen.

### 9. Change the Supabase database password
The database password was shared in chat during development. Do this **after** step 1:
Supabase → **Project Settings → Database → Reset database password**, then update `DATABASE_URL` in Vercel
(Settings → Environment Variables → Redeploy) and in your local `.env`. The site stops working until Vercel has the new value.

### 10. Prepare every team member for the viva
Judges may ask anyone to explain the code (plagiarism: 10 pts). Each member should be able to walk through: login/session
(`src/lib/auth`), adding a transaction and category suggestion (`src/services/transaction.service.ts`, `src/lib/finance/categorize.ts`),
budgets and alerts (`src/services/budget.service.ts`), reports (`src/services/analytics.service.ts`) and the admin panel (`src/app/(app)/admin`).

---

## OPTIONAL POLISH

### 11. Shared rate limiting (Upstash Redis)
Without it, login rate limits are counted per server instance. https://upstash.com → create a Redis database → copy the REST URL and token →
Vercel env vars `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` → Redeploy.
