export default function Select({ value, onChange, options }) {
  // Keep a value that is no longer offered (e.g. a category an admin removed).
  const list = value && !options.includes(value) ? [value, ...options] : options;
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-2.5 rounded-xl border border-border bg-input-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
    >
      {list.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}
