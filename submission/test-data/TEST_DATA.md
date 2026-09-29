# Test data

All values below were read from the repository (`prisma/seed.ts`, `submission/test-data/sample-import.csv`)
and verified against the live deployment on 2026-09-29.

## 1. Seed data (`SEED_RESET=true npm run db:seed` — WIPES the target database first)

| Data | Amount |
| --- | --- |
| Users | 1 student + 1 administrator |
| Default categories | 13 system categories (5 income, 8 expense) |
| Transactions | 236 (≈150 days of history: food, transport, entertainment, academics, shopping, part-time salary, scholarship, one large "Tai nghe mới" purchase) |
| Recurring entries | 5 monthly (allowance 4,500,000; rent 1,800,000; utilities 350,000; Spotify 59,000; 4G plan 90,000) — the scheduler back-fills due months |
| Budgets | 4 categories × 3 months (Ăn uống 2,200,000; Đi lại 500,000; Giải trí 600,000; Dịch vụ số 200,000) |
| Saving goals | "Laptop mới" 12,500,000 / 25,000,000; "Quỹ khẩn cấp" 0 / 5,000,000 |
| Notifications | 1 welcome notification |

Student profile: Nguyễn Văn An, "Năm 3 – Công nghệ thông tin", allowance baseline 6,500,000 VND, savings goal 800,000 VND.

## 2. CSV import file (`sample-import.csv`)

Import on **Transactions → Import CSV** (student account). Each row exercises a specific rule:

| Rows | What it tests | Expected result |
| --- | --- | --- |
| 1, 8 | Category given in file | Uses that category |
| 2–7, 9–14 | Category empty | Category suggested automatically from description (Food, Transport, Academics, Subscriptions, Entertainment, Part-time job, Scholarship, Gift) |
| 11–12 | Identical rows | Second row skipped as a duplicate ("Skip duplicates" is ticked by default) |
| 13 | 18,500,000 expense | Imported, then marked "unusual amount" in the transaction list |
| 15 | `31/09/2026` | Rejected: invalid date |
| 16 | Empty description | Rejected: description required |
| 17 | Amount `abc` | Rejected: invalid amount |

## 3. Automated tests

`npm test` runs the Vitest suite (finance calculations, auth/session, permissions/IDOR, recurring scheduler
idempotency, CSV parsing, reports, assistant intents). `npm run test:coverage` writes `coverage/index.html`.
