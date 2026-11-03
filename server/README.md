# BudgetBuddy API (FastAPI)

```bash
python -m venv .venv
# Windows: .venv\Scripts\activate   macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn src.main:app --reload        # http://127.0.0.1:8000/docs
pytest                               # after: pip install -r requirements-dev.txt
```

* Database: `budgetbuddy.db` (SQLite) is created on first run; set `DATABASE_URL` for PostgreSQL.
* Demo accounts and sample data are seeded automatically (`SEED_DEMO_DATA=false` to disable,
  `python -m src.seed` to re-run).
* Configuration: see `.env.example`.

See the main [README](../README.md) for the full API list and folder layout.
