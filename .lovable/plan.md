

# HandyMan Pro — Solo Handyman Business App

A mobile-first PWA built for a handyman who works with their hands. Dark navy + amber aesthetic, big tap targets, offline-first with local storage.

---

## Phase 1: Foundation & Design System

- Set up PWA with vite-plugin-pwa (manifest, service worker, install prompt)
- Dark navy (#0f1923) base, amber (#f59e0b) accents, custom theme
- Google Fonts: DM Sans (body) + Barlow Condensed (headers)
- Bottom navigation bar: Home | Jobs | Clients | Invoices | Reports
- Large 48px+ tap targets throughout, card-based layout
- Zustand for state management with localStorage persistence
- Slide transitions between screens

## Phase 2: Clients Module

- Client list with search/filter
- Add/edit client form (name, phone, email, address)
- Client detail page showing linked jobs, estimates, invoices, payment history

## Phase 3: Estimates Module

- Create estimate linked to a client
- Line items editor (description, qty, unit price)
- Auto-calculated subtotal, configurable tax %, total
- Notes/terms section
- Status workflow: Draft → Sent → Accepted → Declined
- PDF generation with jsPDF
- Send via `sms:` and `mailto:` links (opens native apps)

## Phase 4: Jobs Module

- Convert accepted estimate into a Job
- Job details: client, description, scheduled date, status
- **Time Tracker**: start/stop timer + manual time entries with running total
- **Expense Tracker**: add expenses with categories (Materials, Tools, Fuel, Subcontractor, Other), optional receipt photo
- Running profitability view: estimated vs. actual cost

## Phase 5: Invoices & Payments

- Generate invoice from completed job (pulls in time entries at configurable hourly rate + expenses)
- Additional line items, balance due calculation
- Partial payment support
- Status: Draft → Sent → Partially Paid → Paid → Overdue
- PDF generation + send via SMS/email
- Log payments with method label (cash, check, Venmo, Zelle, card)
- Payment history per invoice and per client

## Phase 6: Dashboard (Home Screen)

- Weekly summary cards: hours worked, active jobs, money earned
- Outstanding invoices total (overdue highlighted in red/amber)
- Recent activity feed
- Quick-action buttons: + New Estimate, + Log Time, + Add Expense

## Phase 7: Reports & Export

- Monthly summary: revenue, expenses, net profit
- Year-to-date totals
- Top clients by revenue
- Job profitability breakdown
- CSV export for TurboTax / spreadsheet import

## Phase 8: Stretch Goals

- Photo attachments for jobs (before/after)
- Recurring job templates
- Toast notifications and status badges with color coding throughout

