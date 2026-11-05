import { contributionLabel, daysUntil, formatDisplayDate, monthKey, toISODate } from "../formatDate";
import { formatCurrency, pctChange } from "../formatCurrency";
import { canDo } from "../permissions";

test("formats ISO dates like the design (29 Jul 2026)", () => {
  expect(formatDisplayDate("2026-07-29")).toBe("29 Jul 2026");
  expect(monthKey("2026-07-29")).toBe("2026-07");
});

test("daysUntil counts whole days from today", () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  expect(daysUntil(toISODate(tomorrow))).toBe(1);
  expect(daysUntil(toISODate())).toBe(0);
});

test("contribution label falls back to the day when no time is known", () => {
  expect(contributionLabel(toISODate(), null)).toBe("Today");
});

test("currency helper handles negatives", () => {
  expect(formatCurrency(-5806)).toBe("-₹5,806");
  expect(formatCurrency(1234, { sign: true })).toBe("+₹1,234");
  expect(pctChange(110, 100)).toBe(10);
  expect(pctChange(5, 0)).toBeNull();
});

test("role permissions follow the design matrix", () => {
  expect(canDo("student", "add_expense")).toBe(true);
  expect(canDo("student", "delete_expense")).toBe(false);
  expect(canDo("premium", "export_pdf")).toBe(true);
  expect(canDo("premium", "manage_users")).toBe(false);
});
