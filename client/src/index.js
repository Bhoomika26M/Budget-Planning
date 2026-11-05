import React from "react";
import ReactDOM from "react-dom/client";

import "./index.css";
import App from "./App";

// Apply the saved theme before the first paint (avoids a white flash).
try {
  if (localStorage.getItem("bb_dark") === "true") document.documentElement.classList.add("dark");
} catch {
  /* ignore */
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
