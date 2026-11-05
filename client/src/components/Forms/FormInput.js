export default function Input({ value, onChange, placeholder, type = "text", ...rest }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      type={type}
      {...(type === "number" ? { min: 0, step: "any" } : {})}
      {...rest}
      className="w-full px-4 py-2.5 rounded-xl border border-border bg-input-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
    />
  );
}
