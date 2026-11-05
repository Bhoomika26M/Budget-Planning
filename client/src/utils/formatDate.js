const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const pad = (n) => String(n).padStart(2, "0");

/** Date -> "YYYY-MM-DD" in the user's local time zone. */
export function toISODate(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** "YYYY-MM-DD" -> Date at local midnight (avoids UTC off-by-one). */
export function parseISODate(iso) {
  if (!iso) return null;
  const [y, m, d] = String(iso).slice(0, 10).split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

/** "2026-07-29" -> "29 Jul 2026" (format used throughout the design). */
export function formatDisplayDate(iso) {
  const d = parseISODate(iso);
  if (!d || Number.isNaN(d.getTime())) return "";
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** "2026-07-29" -> "2026-07" */
export function monthKey(iso) {
  return String(iso || toISODate()).slice(0, 7);
}

/** "2026-07" -> "July 2026" */
export function formatMonthLabel(key, style = "long") {
  const d = parseISODate(`${key}-01`);
  return d.toLocaleDateString("en-IN", { month: style, year: "numeric" });
}

/** Whole days from today until the given ISO date (negative = past). */
export function daysUntil(iso) {
  const d = parseISODate(iso);
  if (!d) return null;
  const today = parseISODate(toISODate());
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

function toDate(value) {
  if (!value) return null;
  // Backend datetimes from SQLite have no zone – they are UTC.
  const str = String(value);
  const hasZone = /[zZ]|[+-]\d\d:?\d\d$/.test(str);
  return new Date(str.length > 10 && !hasZone ? `${str}Z` : str);
}

/** "2h ago", "3d ago" … */
export function timeAgo(value) {
  const d = toDate(value);
  if (!d || Number.isNaN(d.getTime())) return "";
  const seconds = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDisplayDate(toISODate(d));
}

/** Contribution label like "Today • 10:30 AM" / "Jul 24 • 9:00 AM". */
export function contributionLabel(dateIso, createdAt) {
  const created = toDate(createdAt);
  const day = parseISODate(dateIso);
  const sameDay = created && toISODate(created) === String(dateIso).slice(0, 10);
  const today = toISODate();
  const yesterday = toISODate(new Date(Date.now() - 86400000));
  const iso = String(dateIso).slice(0, 10);
  const dayLabel = iso === today ? "Today" : iso === yesterday ? "Yesterday" : `${MONTHS[day.getMonth()]} ${day.getDate()}`;
  if (!sameDay) return dayLabel;
  const h = created.getHours();
  const time = `${h % 12 || 12}:${pad(created.getMinutes())} ${h >= 12 ? "PM" : "AM"}`;
  return `${dayLabel} • ${time}`;
}

export function formatDateTime(value) {
  const d = toDate(value);
  if (!d || Number.isNaN(d.getTime())) return "";
  return `${toISODate(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatShortDate(value) {
  const d = toDate(value);
  if (!d || Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
