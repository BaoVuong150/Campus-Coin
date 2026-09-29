# User credentials (all account types)

Hosted application: **https://campus-coin-psi.vercel.app**

| Role | Sign-in page | Email | Password |
| --- | --- | --- | --- |
| Student | https://campus-coin-psi.vercel.app/login | `student@campuscoin.edu` | `Student@123` |
| Administrator | https://campus-coin-psi.vercel.app/admin/login | `admin@campuscoin.edu` | `Admin@123` |

- Both logins were tested against the live deployment on 2026-09-29.
- The same accounts are created locally by `SEED_RESET=true npm run db:seed` (see `INSTALLATION.md`).
- Students can also self-register at `/register`. There is no public admin sign-up (an admin can promote a user in Admin → Users); administrators sign in only
  through the separate `/admin/login` portal.
- The student account holds ~5 months of sample data (see `test-data/TEST_DATA.md`).
