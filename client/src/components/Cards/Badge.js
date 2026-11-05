export default function Badge({ children, color = "#2E93C7" }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={{
        background: `${color}18`,
        color,
      }}
    >
      {children}
    </span>
  );
}
