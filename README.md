# BudgetBuddy – Personal Budget Planning & Expense Management Platform

A full-stack personal finance app for students: track pocket money and expenses, plan
monthly budgets, reach savings goals, get alerts, and export reports.

* **Frontend:** React (Create React App) + React Router + Tailwind CSS + Recharts – UI built
  from the *Design BudgetBuddy Dashboard* Figma file
* **Backend:** FastAPI + SQLAlchemy, JWT auth, role-based access (Student / Premium / Admin)
* **Database:** SQLite for local development, PostgreSQL in production

---

## 1. Quick start (local)

You need **Python 3.10+** and **Node.js 18+**.

### Backend (terminal 1)

```bash
cd server
python -m venv .venv
# Windows: .venv\Scripts\activate      macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn src.main:app --reload
```

API → http://127.0.0.1:8000 · interactive docs → http://127.0.0.1:8000/docs

On first start the database (`server/budgetbuddy.db`) is created and filled with demo data.

### Frontend (terminal 2)

```bash
cd client
npm install
npm start
```

App → http://localhost:3000

> The frontend talks to `http://127.0.0.1:8000` by default. To change it, copy
> `client/.env.example` to `client/.env` and edit `REACT_APP_API_URL`.

### Demo accounts

Click a role card on the login screen – the credentials are filled in for you.

| Role | Email | Password | Can do |
|------|-------|----------|--------|
| Student | `john.doe@budgetbuddy.in` | `budget2025` | Dashboard, expenses, income, savings goals, notifications |
| Premium | `premium@budgetbuddy.in` | `premium123` | Everything above + budgets, analytics, reports, exports, deleting records, AI insights |
| Admin | `admin@budgetbuddy.in` | `admin2026` | Admin panel: users, subscriptions, categories, platform analytics, logs, announcements, feedback, issues |

New sign-ups start as **Student**. Use *Upgrade to Premium* (demo checkout, no money is
charged) or let an admin change the plan.

To start over with fresh demo data, stop the server and delete `server/budgetbuddy.db`.

---

## 2. Features (mapped to the project milestones)

| Module | What is implemented |
|--------|--------------------|
| Authentication & roles | Register / login with JWT, "remember me", forgot-password with 6-digit OTP, optional Google & GitHub OAuth2, Student / Premium / Admin access control (enforced in the API **and** the UI) |
| Profile | Name, email, university, programme, monthly income, preferences, change password, delete account |
| Expenses | Add / edit / delete, categories (admin-managed), status (Completed / Pending / Cancelled), search, category & month filters, CSV export |
| Income | Pocket money, scholarship, freelance, part-time; frequency (monthly / weekly / one-time), cash-flow chart, upcoming recurring income |
| Budgets | Monthly budget, category limits, **spent calculated automatically from expenses**, utilisation charts, over-limit warnings |
| Savings goals | Create / edit / delete, contributions with history, progress rings, deadline countdown + extend date, completion celebration |
| Notifications | Budget near / exceeded alerts, goal deadline & milestone alerts, weekly savings reminder, monthly report ready, admin announcements |
| Analytics | Avg daily spend, top category, savings rate, budget efficiency, category pie, income vs expenses, spending trend, savings growth, rule-based AI insights |
| Reports | Monthly / yearly report built by the API, preview, **PDF** (in browser), **CSV** and **Excel (.xlsx)** export |
| Admin | User management (edit, role, suspend, delete), subscriptions, categories, platform analytics, system logs, announcements, feedback, reported issues, permission matrix |

Use the **calendar in the header** to switch the month shown on the Dashboard, Budgets,
Expenses summary and Reports.

---

## 3. Folder structure

```
Budget-Planning/
├── client/                         React app
│   ├── public/
│   └── src/
│       ├── App.js                  routes + role guards
│       ├── index.css               Tailwind + Figma theme (light / dark)
│       ├── components/
│       │   ├── Access/             AccessDenied, FeatureLock, LockedButton (role gates)
│       │   ├── Buttons/            PrimaryButton
│       │   ├── Cards/              Card, StatCard, Badge, CircleProgress, RoleBadge, HelpFeedbackCard
│       │   ├── Forms/              Field, FormInput, FormSelect, StatusSelect, DatePicker, FormError
│       │   └── Modals/             Expense / Income / Budget / Goal / Pricing / Confirm … modals
│       ├── context/                AuthContext, FinanceContext (data + CRUD), AnalyticsContext, ToastContext
│       ├── data/                   constants (roles, categories, colours), navigation
│       ├── features/
│       │   ├── admin/              AdminPanel
│       │   ├── authentication/     LoginForm, SignupForm, ForgotPasswordModal, AuthPanel
│       │   └── budget/             Budget (planner), Analytics
│       ├── hooks/                  useScreenNavigate, useSubmit
│       ├── layout/                 PageContainer (shell), Sidebar, Navbar
│       ├── pages/                  Home (dashboard), Expenses, Income, Budget, Savings, Analytics,
│       │                           Reports, Notifications, Profile, Settings, Admin, Login
│       ├── services/               api.js (all endpoints), mappers.js (API ⇄ UI shapes)
│       └── utils/                  formatDate, formatCurrency, download, permissions, getInitials
│
├── server/                         FastAPI app
│   ├── src/
│   │   ├── main.py                 app, CORS, routers, table creation, demo seed
│   │   ├── database/core.py        engine (SQLite / PostgreSQL), session, column auto-migration
│   │   ├── entities/user.py        User model (role, plan, preferences …)
│   │   ├── auth/                   register, login, JWT, OTP reset, OAuth2, role dependencies
│   │   ├── users/                  profile, password, upgrade, delete account
│   │   ├── expenses/  income/  budgets/  savings/
│   │   ├── notifications/          alerts engine + optional SendGrid e-mail
│   │   ├── analytics/  reports/    charts, insights, CSV / Excel export
│   │   ├── categories/  support/   admin-managed categories, feedback & issues
│   │   ├── admin/  logs/           admin endpoints, system logs
│   │   ├── rate_limiter.py         login / OTP throttling
│   │   └── seed.py                 demo accounts + sample data
│   └── tests/                      pytest (unit + API end-to-end)
│
├── docker-compose.yml              web + api + PostgreSQL
└── .github/workflows/ci.yml        tests + build on every push
```

Each backend module follows the same pattern: `entity.py` (SQLAlchemy table),
`models.py` (Pydantic request/response), `service.py` (logic), `controller.py` (routes).

---

## 4. API overview

All routes except register / login / forgot-password need `Authorization: Bearer <token>`.
Full, try-it-out documentation is at **`/docs`**.

| Area | Endpoints |
|------|-----------|
| Auth | `POST /api/auth/register` · `POST /api/auth/login` · `GET /api/auth/me` · `POST /api/auth/forgot-password` · `POST /api/auth/verify-otp` · `POST /api/auth/reset-password` · `GET /api/auth/oauth/{google\|github}/login` |
| Users | `GET/PATCH /api/users/me` · `POST /api/users/me/change-password` · `POST /api/users/me/upgrade` · `DELETE /api/users/me` |
| Expenses | `GET/POST /api/expenses/` (`?month=YYYY-MM&category=`) · `PATCH/DELETE /api/expenses/{id}` · `GET /api/expenses/summary` |
| Income | `GET/POST /api/income/` · `PATCH/DELETE /api/income/{id}` |
| Budgets (Premium) | `GET/POST /api/budgets/` (`?month=`) · `PATCH/DELETE /api/budgets/{id}` · `PUT /api/budgets/monthly` |
| Savings | `GET/POST /api/savings/` · `PATCH/DELETE /api/savings/{id}` · `POST/GET /api/savings/{id}/contributions` · `GET /api/savings/contributions` |
| Notifications | `GET /api/notifications/` · `PATCH /api/notifications/{id}/read` · `POST /api/notifications/read-all` · `DELETE /api/notifications/{id}` |
| Analytics | `GET /api/analytics/overview` (`?month=&months=`) · `GET /api/analytics/insights` (Premium) |
| Reports (Premium) | `GET /api/reports/summary?period=monthly\|yearly&month=` · `GET /api/reports/export?format=csv\|xlsx` |
| Support | `POST /api/support/feedback` · `POST /api/support/issues` · `GET /api/categories/` |
| Admin | `/api/admin/users`, `/analytics`, `/categories`, `/logs`, `/announcements`, `/feedback`, `/issues` |

---

## 5. Tests

```bash
cd server && pip install -r requirements-dev.txt && pytest        # 25+ API & unit tests
cd client && CI=true npm test -- --watchAll=false                   # utility + render tests
```

---

## 6. Configuration & deployment

Backend settings come from environment variables – see `server/.env.example`
(`DATABASE_URL`, `JWT_SECRET_KEY`, `FRONTEND_URL`, OAuth and SendGrid keys).

* **Docker (everything incl. PostgreSQL):** `docker compose up --build` → app on
  http://localhost:3000, API on http://localhost:8000
* **Render / Railway (API):** root `server`, build `pip install -r requirements.txt`,
  start `uvicorn src.main:app --host 0.0.0.0 --port $PORT`, set `DATABASE_URL`,
  `JWT_SECRET_KEY`, `FRONTEND_URL`.
* **Vercel / Netlify (client):** root `client`, build `npm run build`, output `build`,
  env `REACT_APP_API_URL=<your API URL>`, and add a SPA rewrite to `index.html`.

**OAuth2:** create a Google and/or GitHub OAuth app with callback
`<BACKEND_URL>/api/auth/oauth/google/callback` (or `/github/callback`) and set the
client id / secret variables. Without them the buttons explain that social login isn't
configured.

**Older databases:** pulling this version onto an existing `budgetbuddy.db` is fine – new
columns are added automatically on start-up.

---

## License

MIT – see [LICENSE](LICENSE).
