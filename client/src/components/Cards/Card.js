// ── Reusable UI ────────────────────────────────────────────────────
export default function Card({ children, className = "", ...rest }) {
  return (
    <div className={`bg-card rounded-2xl shadow-sm border border-border ${className}`} {...rest}>
      {children}
    </div>
  );
}
