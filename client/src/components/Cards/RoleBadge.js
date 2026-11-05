import { Crown, GraduationCap, ShieldCheck } from "lucide-react";
import { ROLE_META } from "../../data/constants";

export default function RoleBadge({ role }) {
  const m = ROLE_META[role];
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold"
      style={{
        background: m.bg,
        color: m.color,
      }}
    >
      {role === "admin" && <ShieldCheck size={10} />}
      {role === "premium" && <Crown size={10} />}
      {role === "student" && <GraduationCap size={10} />}
      {m.label}
    </span>
  );
}
