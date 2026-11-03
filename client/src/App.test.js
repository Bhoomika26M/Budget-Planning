import { render, screen } from "@testing-library/react";
import App from "./App";

// recharts / motion need browser APIs that jsdom lacks
beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  window.matchMedia =
    window.matchMedia ||
    (() => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }));
  global.fetch = jest.fn(() => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ google: false, github: false }) }));
});

test("shows the login screen when signed out", async () => {
  render(<App />);
  expect(await screen.findByText("Welcome back")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Sign in to BudgetBuddy" })).toBeInTheDocument();
});
