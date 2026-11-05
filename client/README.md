# BudgetBuddy Web App (React)

```bash
npm install
npm start          # http://localhost:3000  (backend must run on :8000)
npm test           # unit tests
npm run build      # production build in ./build
```

Set `REACT_APP_API_URL` in `.env` (see `.env.example`) if the API is not on
`http://127.0.0.1:8000`.

UI is ported from the **Design BudgetBuddy Dashboard** Figma file. Tailwind tokens live in
`tailwind.config.js` and `src/index.css` (light + dark theme). See the main
[README](../README.md) for the folder structure.
