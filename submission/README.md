# Campus Coin — TechWiz 7 submission package

| File | Contents | Made by |
| --- | --- | --- |
| `CREDENTIALS.md` | Login for every account type + hosted URL | Verified on the live site |
| `INSTALLATION.md` | Installation instructions (hosted and local) | From the repository |
| `FEATURE_CHECKLIST.md` | Every SRS functional requirement → page to show in the video | From the code |
| `database/database.sql` | Final database script (tables, PK, FK, unique, CHECK constraints) | Copy of `/database.sql` |
| `database/erd.mmd` | ERD (Mermaid) — paste into https://mermaid.live and export PNG for the report | Generated from `prisma/schema.prisma` |
| `database/data-dictionary.md` | Tables, columns, types, keys | Generated from `prisma/schema.prisma` |
| `test-data/TEST_DATA.md` | Seed data and test cases | From `prisma/seed.ts` |
| `test-data/sample-import.csv` | CSV file for the bulk-import demo | — |
| `ReadMe-assumptions-draft.md` | Facts for the team's ReadMe.doc | Draft — team must review |
| `deliverables/` | Put the video (.mp4), ReadMe.doc and project report here | **Team** |

Regenerate the database files after a schema change: `node scripts/generate-db-docs.mjs`.
Build the final ZIP (from the latest commit): `node scripts/package-submission.mjs "<FILE_NAME>"` → `dist-submission/<FILE_NAME>.zip`.
