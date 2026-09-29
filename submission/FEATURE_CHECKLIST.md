# SRS functional requirements → where to find them (video recording checklist)

The SRS requires the .mp4 to show **every** functional requirement. Record in this order and tick each line.
Accounts: see `CREDENTIALS.md`. Test file for CSV import: `test-data/sample-import.csv`.

## 0. Public pages
- [ ] Home page `/` — scroll to the **Sitemap** section (mandatory deliverable)
- [ ] Language switch VI / EN, dark mode toggle

## 1. User authentication & management
- [ ] Register a new student `/register` → onboarding `/onboarding` (allowance, pay day, savings goal)
- [ ] Student login `/login`; separate admin login `/admin/login` (student credentials are rejected there)
- [ ] Forgot password `/forgot-password` → email link → `/reset-password` (production: needs Resend configured)
- [ ] Profile: Settings → name, academic year, monthly allowance baseline, monthly savings goal
- [ ] Bulk CSV import: Transactions → Import CSV → upload `sample-import.csv` → preview, suggested categories, invalid rows, duplicate skipped
- [ ] Secure session: Settings → Security → change password / sign out of all other devices

## 2. Category management
- [ ] Default income & expense categories shown in the category picker
- [ ] Settings → Categories: add, edit, delete a personal category ("Manage Own Categories")

## 3. Personalized dashboard `/dashboard`
- [ ] Greeting with the student's name, month balance (income vs expense)
- [ ] Quick-add buttons (header "Add transaction", quick-add card, + on mobile)
- [ ] "Top category" insight + category breakdown, "Budget vs actual" card
- [ ] Personalized saving tips card (pin / dismiss)

## 4. Income & expense logging `/transactions`
- [ ] Quick-add form for income and expense
- [ ] Recurring entries `/recurring` (allowance, rent, Spotify…) — generated automatically when due
- [ ] Edit and delete a transaction → open it again → **Change history** section shows created/edited entries
- [ ] "Recently viewed" chips above the transaction list (persist after sign-out/sign-in on the same browser)

## 5. AI-driven categorization
- [ ] Type "Campus Cafe" / "Highlands Coffee" → Food suggested automatically
- [ ] Override the suggestion; add a similar description again → the corrected category is suggested (learning)
- [ ] CSV import suggests categories for every row without one (batch)

## 6. Monthly reports `/reports`
- [ ] Category-wise spending, income vs expense for the last 6 months (dashboard cash-flow card, 6-month preset)
- [ ] Daily trend + **weekly summary** for the current month
- [ ] Filters: date range (From/To), category, income source
- [ ] Export **PDF** and **image (PNG)**

## 7. AI-generated monthly insights
- [ ] Insights card on the dashboard (plain-language summary, category spike e.g. "+40%", actionable advice)
- [ ] Reports → insight history of previous months; bookmark (pin) one

## 8. Saving tips engine
- [ ] Tips ranked by potential saving on the dashboard; pin one, dismiss one

## 9. Budget goals & alerts `/budgets`
- [ ] Set a monthly budget per category; progress bars update after adding an expense
- [ ] Add expenses until ≥ 80 % / over the limit → in-app notification (bell icon, `/notifications`)

## 10. Bookmarking & sharing
- [ ] Pinned tip / pinned insight visible later
- [ ] Reports → "Send by email" (visible only when email delivery is configured) and PDF export

## 11. Admin control panel (sign in as admin)
- [ ] `/admin` — active users, total transactions, most-used categories
- [ ] `/admin/users` — view list, disable/enable, reset password (temporary password), export CSV
- [ ] `/admin/system` — default categories add/edit/delete, system announcement, tip templates, admin audit log

## 12. Advanced UX & accessibility
- [ ] Recently viewed/edited transactions (section 4)
- [ ] Next-month forecast on the dashboard ("Projected month-end" card → "<month> forecast")
- [ ] Unusually large transaction warning (add an 18,500,000 expense) and duplicate warning (add the same transaction twice)
- [ ] Dark mode + font size (Settings → Appearance)
- [ ] Breadcrumbs at the top of every app page
- [ ] Loading indicators / skeletons while charts and insights load
- [ ] Assistant chatbot (round bot button, bottom-right): ask "How much can I spend today?", "Which category do I spend most on?"
- [ ] Responsive: resize to mobile width (bottom navigation, filter bottom sheet)
