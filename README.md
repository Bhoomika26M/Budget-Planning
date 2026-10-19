# BudgetBuddy: Dashboard & Reports

Milestone 3 module by **Ann Rose P T**: the Dashboard and Reports pages of BudgetBuddy, a personal budget planning app.

## Tech stack
- React 18 + Vite
- React Router (page navigation)
- Recharts (charts)
- Plain CSS (no UI library)

## Features

### Dashboard (`/dashboard`)
- Summary cards: total balance, income, expenses and savings for the current month
- Donut chart of spending by category
- Income vs expenses bar chart for the last 6 months
- Budget progress bars per category (amber at 90%, red when over budget)
- Over-budget alert banner
- Recent transactions list

### Reports (`/reports`)
- Period filter: this month, last 3 months, last 6 months, or a custom date range
- Category filter
- Totals for the selected period, including average monthly spend
- Income vs expenses by month (bar chart) and savings trend (line chart)
- Category-wise table: budget, spent, remaining, % used
- Full transaction list for the period
- Export to CSV (category summary and transactions)

## Run locally
```bash
npm install
npm run dev
```
Then open http://localhost:5173

## Folder structure
```
src/
├── components/
│   ├── Layout.jsx        # sidebar + page outlet
│   └── StatCard.jsx      # summary card
├── data/
│   └── transactions.js   # sample data, categories, budgets, colours
├── pages/
│   ├── Dashboard.jsx
│   └── Reports.jsx
├── utils/
│   └── finance.js        # totals, grouping, date ranges, CSV export
├── index.css
└── main.jsx              # routes
```

## Connecting to the backend
The pages read from `src/data/transactions.js`. When the team's API is ready, replace the `transactions` export with fetched data that keeps the same shape:

```js
{ id, date: "YYYY-MM-DD", description, category, type: "income" | "expense", amount }
```
