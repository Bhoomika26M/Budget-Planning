import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import Card from "./Card";

// ── Stat card ──────────────────────────────────────────────────────
export default function StatCard({ label, value, sub, trend, icon: Icon, gradient }) {
  return (
    <Card className="p-5 flex items-start gap-4 hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${gradient}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-foreground font-['Poppins'] mt-0.5">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
          {trend === "up" && <ArrowUpRight size={12} className="text-green-500" />}
          {trend === "down" && <ArrowDownRight size={12} className="text-red-500" />}
          {sub}
        </p>
      </div>
    </Card>
  );
}
