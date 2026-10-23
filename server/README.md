# Backend setup

From the repository root in PowerShell:

```powershell
cd server
py -m venv .venv
.\.venv\Scripts\Activate.ps1
py -m pip install -r requirements.txt
$env:JWT_SECRET_KEY = py -c "import secrets; print(secrets.token_urlsafe(48))"
```

To bootstrap the first administrator, set both values before starting the server.
Use an email and password you control; the password must be at least 12 characters.

```powershell
$env:INITIAL_ADMIN_EMAIL = "admin@example.com"
$env:INITIAL_ADMIN_PASSWORD = "<your-unique-password-at-least-12-characters>"
```

Then start FastAPI:

```powershell
py -m uvicorn src.main:app --reload
```

The API docs are at `http://127.0.0.1:8000/docs`. Student accounts can be
registered with `POST /auth/register`; public registration cannot assign roles.
Sign-in uses the OAuth2 password token endpoint (`POST /auth/token`) and
returns a signed JWT. Protected endpoints use `Authorization: Bearer <token>`.
An administrator can list accounts and change roles through `/auth/users`.
Signed-in users can read and update their own profile with `GET /auth/me` and
`PATCH /auth/me`. The profile page also uses the existing authenticated
transaction, income-source, and settings endpoints; recurring income sources
are saved as actual account records, not seeded data.

Expense endpoints (`/expenses/`) require a bearer token and only expose
expenses owned by the signed-in account. Each new expense is linked to its
dashboard transaction so creating, editing, or deleting it keeps both views in
sync. Analytics (`/api/analytics`) requires a Premium or Admin account and
aggregates only that account's transactions; it does not accept a client-
selected user ID.

Savings goals use the authenticated `/savings-goals/` endpoints. Each account
can list and create its own goals, update saved progress with
`PATCH /savings-goals/{goal_id}`, and delete goals with
`DELETE /savings-goals/{goal_id}`. Goal amounts are validated so saved progress
cannot exceed the target.

Monthly budgets use authenticated `/budgets/` endpoints. Each account can
create, list, update, and delete its own category limits; returned spending
totals are calculated from that account's expense transactions in the current
month. `/budgets/alerts` reports categories that have reached at least 80% of
their limit.

`JWT_SECRET_KEY` must be configured for production. If it is not set locally,
the server creates a process-only random key, so restarting it invalidates
existing local access tokens. External OAuth provider login is not configured;
provider credentials and callback URLs are required before adding that flow.
For a deployed frontend on a different origin, set `CORS_ALLOWED_ORIGINS` to
its exact origin(s), comma-separated, and build the frontend with
`VITE_API_BASE_URL` set to the deployed API base URL. Do not use a wildcard
origin with credentialed requests.

The startup compatibility migration adds authentication, profile, expense
ownership, and transaction-link fields without deleting existing rows.
Unowned legacy expenses remain unassigned and are not visible to any user.
Existing accounts without a
password hash require an administrator-managed, identity-verified migration
before they can sign in; public registration will not let someone claim an
existing email address. For production deployments, run schema changes as a
planned database migration before starting multiple application workers.
