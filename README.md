# BudgetBuddy

> **Full-Stack Personal Budget Planning and Expense Management Platform**

BudgetBuddy is a modern SaaS-inspired financial management platform designed to help students, individuals, and premium users master their personal finances through budget planning, expense tracking, savings goals, and visual analytics.

---

## 1. Project Overview & Architecture

BudgetBuddy is structured into a clean, decoupled full-stack architecture:

- **Frontend (`client/`):** React.js + Vite with React Router, Lucide React icons, and Recharts. Designed with a light blue background (`#F0F4F8`), clean white cards, navy buttons, and responsive layouts.
- **Backend (`server/`):** Python FastAPI application organized into `routers`, `models`, `schemas`, `services`, and `core` configuration.
- **Relational Database:** Dual-engine architecture supporting both **PostgreSQL** and **SQLite** (`budgetbuddy.db`) via SQLAlchemy 2.0 ORM and Alembic migrations.
- **Security:** Password hashing with bcrypt, stateless JWT token authentication, and strict user-level data isolation.

```
BudgetBuddy/
├── client/                      # Frontend Application (React + Vite)
│   ├── src/
│   │   ├── components/          # Reusable UI components (Cards, Forms, Buttons, Modals)
│   │   ├── pages/               # Views (Auth, Dashboards, Expenses, Incomes, etc.)
│   │   ├── services/            # Axios API client with JWT interceptor
│   │   ├── context/             # Global React state (AuthContext)
│   │   ├── hooks/               # Custom React hooks
│   │   ├── assets/              # Static media & icons
│   │   ├── App.jsx              # Application Shell & Route Provider
│   │   ├── index.css            # Global CSS Theme & Design Tokens
│   │   └── main.jsx             # React DOM entry point
│   ├── index.html
│   ├── package.json             # Frontend dependencies (React, Recharts, Lucide, Axios)
│   └── vite.config.js           # Vite dev server & /api proxy configuration
│
├── server/                      # Backend API (FastAPI + SQLAlchemy)
│   ├── app/
│   │   ├── core/                # Configuration (config.py) & Security (security.py)
│   │   ├── models/              # SQLAlchemy ORM Models (User, Profile, Expense, etc.)
│   │   ├── schemas/             # Pydantic Schemas for request/response validation
│   │   ├── routers/             # API route handlers (Health, Auth, Expenses, etc.)
│   │   ├── services/            # Business logic and financial calculators
│   │   ├── database.py          # SQLAlchemy engine, session maker, get_db dependency
│   │   └── main.py              # FastAPI app initialization, CORS, and startup hooks
│   ├── alembic/                 # Database migration scripts & environment
│   │   ├── versions/            # Versioned migration files (001_initial_schema.py)
│   │   └── env.py               # Alembic database connector
│   ├── tests/                   # Pytest automated test suite
│   ├── alembic.ini              # Alembic migration configuration
│   ├── requirements.txt         # Python dependencies
│   ├── .env.example             # Environment variable template
│   └── .env                     # Local environment settings
│
├── .gitignore                   # Git ignore rules for Python, Node, DB & secrets
└── README.md                    # Project documentation & run guide
```

---

## 2. Relational Database Design

The database schema guarantees **complete multi-tenant privacy**: all financial records are linked directly to a `user_id` foreign key with `ON DELETE CASCADE`.

| Table | Purpose | Key Fields |
| :--- | :--- | :--- |
| `users` | Accounts, hashed credentials & roles | `id`, `email`, `hashed_password`, `role`, `is_active` |
| `user_profiles` | Preferences, currency, monthly income | `user_id`, `full_name`, `currency`, `monthly_income` |
| `expenses` | Categorized spending records | `user_id`, `title`, `amount`, `category`, `payment_method`, `date` |
| `incomes` | Inflow streams (salary, scholarship, etc.) | `user_id`, `source`, `amount`, `date` |
| `budgets` | Monthly & category spending limits | `user_id`, `month`, `category`, `amount_limit` |
| `savings_goals` | Financial targets | `user_id`, `title`, `target_amount`, `saved_amount`, `status` |
| `savings_contributions` | Incremental deposits | `goal_id`, `user_id`, `amount`, `date`, `notes` |
| `notifications` | Alerts, overspend warnings | `user_id`, `title`, `message`, `type`, `is_read` |

---

## 3. Installation & Setup Guide

### Prerequisites
- **Node.js:** v18+ or v22+
- **Python:** 3.8+ (3.8, 3.9, 3.10, 3.11, or 3.12)
- **PostgreSQL** (optional; SQLite is preconfigured for zero-friction local testing)

---

### Step 1: Backend Setup (FastAPI)

1. Open a terminal in the `BudgetBuddy/server` directory:
   ```bash
   cd server
   ```

2. Create a Python virtual environment:
   ```bash
   python -m venv venv
   ```

3. Activate the virtual environment:
   - **Windows:**
     ```powershell
     .\venv\Scripts\activate
     ```
   - **macOS / Linux:**
     ```bash
     source venv/bin/activate
     ```

4. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Configure environment variables:
   A `.env` file is already provided. To switch from SQLite to PostgreSQL, simply edit `server/.env`:
   ```ini
   # For PostgreSQL:
   DATABASE_URL=postgresql://postgres:your_password@localhost:5432/budgetbuddy
   ```

6. Run the database migrations (Alembic):
   ```bash
   alembic upgrade head
   ```

7. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   - Interactive Swagger API Documentation: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
   - Alternative ReDoc Documentation: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
   - Health Check Endpoint: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)

---

### Step 2: Frontend Setup (React + Vite)

1. Open a new terminal in the `BudgetBuddy/client` directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   - Open your browser at: [http://localhost:5173](http://localhost:5173)

---

### Step 3: Running Tests

To run the backend test suite:
```bash
cd server
pytest -v
```

The tests verify:
- Health check and live database connectivity (`SELECT 1`).
- Root welcome endpoint.
- Secure bcrypt password hashing.
- SQLAlchemy ORM model relationships and foreign keys.
- User-level data isolation and cascading deletes.
