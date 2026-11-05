import { Lock } from "lucide-react";
import { canDo } from "../../utils/permissions";
import { ROLE_META } from "../../data/constants";

// ── LockedBtn — inline locked button replacement ───────────────────
export default function LockedBtn({ role, feature, onClick, children, className = "", style }) {
  if (canDo(role, feature)) {
    return (
      <button type="button" onClick={onClick} className={className} style={style}>
        {children}
      </button>
    );
  }
  const requiredRole = feature === "manage_users" ? "admin" : "premium";
  const meta = ROLE_META[requiredRole];
  return (
    <div className="relative group inline-flex">
      <button type="button" disabled title={`${meta.label} feature`} className={`${className} opacity-40 cursor-not-allowed`} style={style}>
        {children}
      </button>
      <div
        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex items-center gap-1.5
        px-3 py-1.5 rounded-lg text-xs font-medium text-white whitespace-nowrap z-50 shadow-lg pointer-events-none"
        style={{
          background: meta.color,
        }}
      >
        <Lock size={10} />
        {meta.label} only
      </div>
    </div>
  );
}
