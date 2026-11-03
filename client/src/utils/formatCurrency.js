/** 12345.6 -> "₹12,346" (whole rupees, Indian digit grouping). */
export function formatCurrency(value, { decimals = 0, sign = false } = {}) {
  const n = Number(value) || 0;
  const text = Math.abs(n).toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  const prefix = n < 0 ? "-" : sign && n > 0 ? "+" : "";
  return `${prefix}₹${text}`;
}

/** Short axis label: 12500 -> "₹13k" */
export function formatK(value) {
  return `₹${((Number(value) || 0) / 1000).toFixed(0)}k`;
}

/** Percentage change helper, null when there is nothing to compare to. */
export function pctChange(current, previous) {
  if (!previous) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}
