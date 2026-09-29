# Project installation instructions

## Requirements

| Software | Version |
| --- | --- |
| Node.js | 20.9 or newer (22 LTS recommended) — includes npm |
| PostgreSQL | 13 or newer (local install, Supabase or Neon) |
| Browser | Chrome, Edge, Firefox or Opera (latest) |

## Option A — use the hosted version

Open **https://campus-coin-psi.vercel.app** and sign in with the accounts in `CREDENTIALS.md`. Nothing to install.

## Option B — run locally

1. Unzip the submission and open a terminal in the project folder (the folder containing `package.json`).
2. Install dependencies:
   ```
   npm ci
   ```
3. Create an empty PostgreSQL database, for example `campus_coin`.
4. Copy `.env.example` to `.env` and fill in:
   ```
   DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/campus_coin"
   JWT_SECRET="any random string of at least 32 characters"
   CRON_SECRET="another random string of at least 32 characters"
   APP_URL="http://localhost:3000"
   ```
5. Create the tables — choose **one**:
   - `npx prisma migrate deploy` (recommended), or
   - run `database.sql` in the empty database (for example `psql -d campus_coin -f database.sql`, or paste it into pgAdmin / the Supabase SQL editor).
6. Load the demo data (this deletes any existing data in that database):
   ```
   SEED_RESET=true npm run db:seed
   ```
   On Windows PowerShell: `$env:SEED_RESET="true"; npm run db:seed`
7. Build and start:
   ```
   npm run build
   npm start
   ```
   (or `npm run dev` for development mode)
8. Open http://localhost:3000 and sign in with the accounts in `CREDENTIALS.md`.

## Notes

- Password-reset emails: without `RESEND_API_KEY`, development mode (`npm run dev`) saves each email as an `.html` file in the
  `.mail/` folder — open it to click the reset link. Production mode (`npm start`) never fakes delivery: it needs
  `RESEND_API_KEY`, `MAIL_FROM` and an `https://` `APP_URL`, otherwise "Forgot password" reports that email is unavailable.
- Recurring transactions are generated automatically when a user opens the app and by the daily cron (`npm run cron:recurring` runs it once by hand).
- Quality checks: `npm run lint`, `npm run typecheck`, `npm test`, `npm run test:coverage`.
