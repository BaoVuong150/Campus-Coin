# ReadMe — assumptions (DRAFT for the team to review)

> The SRS asks for a `ReadMe.doc` listing the assumptions the team made. This draft lists the facts the code implements.
> Review each point, rewrite it in your own words, add team details, and save it as **ReadMe.doc** in `submission/deliverables/`.
> (SRS rule: AI tools must not fully produce the documentation.)

1. **Currency and time zone.** All amounts are in Vietnamese đồng (VND) and dates use the Vietnam time zone (UTC+7). Users cannot change these.
2. **Technology stack.** The app is built with Next.js (React front end + Node.js API routes, TypeScript) and PostgreSQL through
   Prisma ORM. The SRS lists MERN/Java/.NET/PHP/Python stacks and MySQL/SQL Server/MongoDB; we chose a React + Node.js stack with a
   relational database (PostgreSQL) because the data is relational (users → transactions → categories → budgets).
3. **AI features are rule-based and statistical.** Category suggestions use merchant/keyword rules plus each student's own
   past corrections (stored in `category_preferences`). Monthly insights and saving tips compare the current month with the
   student's own averages and budgets. No external AI API is called, so no financial data leaves the system. Suggestions are
   advisory and can always be overridden (SRS 1.5).
4. **Chatbot.** Instead of an external widget (tawk.to / Tidio), the app has a built-in assistant that answers questions from the
   student's own data (balance, safe daily spend, top category, budget) and explains how to use each feature.
5. **Email.** Password-reset and report emails are sent through Resend. When email is not configured, the app says so instead of
   pretending the email was sent.
6. **Default categories** are stored in Vietnamese and translated in the English UI. Mapping to the SRS: Allowance = Trợ cấp gia đình,
   Part-time Job = Việc làm thêm, Scholarship = Học bổng, Gift = Quà tặng / Thưởng, Other Income = Thu nhập khác, Food = Ăn uống,
   Transport = Đi lại, Hostel/Rent = Tiền trọ / KTX, Academics = Học tập, Subscriptions = Dịch vụ số, Entertainment = Giải trí,
   Miscellaneous = Chi tiêu khác. One extra expense category was added: Mua sắm (Shopping).
7. **Budgets** are set per category per month. Alerts are sent at 80 % and when the limit is exceeded (once per level per month).
8. **Recurring entries** are generated once per due date by a daily scheduled job and when the student opens the app.
9. **Administrator accounts** come from the seed script or are promoted by an existing admin (Admin → Users); there is no public admin sign-up.
10. **"Recently viewed / edited" transactions** are remembered in the browser (per user, per device).
11. **Next-month forecast** = recurring income − recurring costs − recent daily flexible spending × days in the month.
    Irregular income (part-time work, scholarships, gifts) is left out, so the forecast is not over-optimistic.
12. **CSV import** accepts up to 500 rows per file; duplicate rows (same date, type, amount, description) are skipped by default.
13. **Deleted transactions** are removed from reports, but their audit trail (create/update/delete snapshots) is kept in `transaction_audits`.
