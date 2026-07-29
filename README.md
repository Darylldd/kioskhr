# HR Kiosk System

Full-stack HR management system for daily time records, payslips, travel orders, pass slips, and employee records. This is a rebuild of an older Express/EJS/MySQL app, rewritten on Nuxt 4 and Firebase.

## Background

The original version of this ran on Express, EJS templates, and MySQL. It got the job done, but server-rendered templating and maintaining a separate MySQL instance added more overhead than the project really needed. This repo is a full migration to Nuxt 4 / Vue 3, with Firestore replacing MySQL and Pinia handling state on the client.

Everything from the old system was carried over — same features, same workflows, just a different stack underneath.

## What it does

- **Daily Time Record (DTR)** — clock in/out tracking for employees
- **Payslips** — generates both standard and government-format payslips as PDFs and emails them directly to employees
- **Travel Orders** — request and approval workflow
- **Pass Slips** — permission-to-leave requests
- **Employee management** — records, roles, and access levels
- **Audit log** — tracks who changed what, and when

15+ pages, 30+ API endpoints in total.

## Stack

- Nuxt 4 / Vue 3 / TypeScript
- Firebase Firestore
- Pinia
- Tailwind CSS
- jsPDF — PDFs generated server-side, no third-party PDF service involved
- Nodemailer — payslip delivery
- argon2 — password hashing

## Auth

Sessions use HTTP-only cookies rather than a client-stored JWT. Role checks happen on the server for every API route, not just in the UI — a regular employee account can't call an admin endpoint just by knowing the URL.

## Running it locally

```bash
git clone <your-repo-url>
cd hr-kiosk
npm install
```

Create a `.env` file:

```
FIREBASE_API_KEY=
FIREBASE_AUTH_DOMAIN=
FIREBASE_PROJECT_ID=
FIREBASE_STORAGE_BUCKET=
FIREBASE_MESSAGING_SENDER_ID=
FIREBASE_APP_ID=

SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=

SESSION_SECRET=
```

```bash
npm run dev
```

Runs on `localhost:3000` by default.

## Structure

```
hr-kiosk/
├── components/
├── composables/
├── layouts/
├── middleware/        # auth + role guards
├── pages/
│   ├── dtr/
│   ├── payslip/
│   ├── travel-orders/
│   ├── pass-slip/
│   ├── employees/
│   └── audit-log/
├── server/
│   ├── api/           # backend routes
│   └── utils/         # pdf, email, and firestore helpers
├── stores/
└── nuxt.config.ts
```

## Still working on

- No automated tests yet — everything's been tested manually so far
- Dark mode has some rough edges on a few of the older ported pages
- Audit log currently loads all records at once, needs pagination as it grows

## Heads up

Built for internal use at a specific office — not a drop-in solution for other organizations. The payslip layout and government payslip format follow local requirements and would need adjusting for anywhere else.