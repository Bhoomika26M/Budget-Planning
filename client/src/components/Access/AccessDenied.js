import { useState } from "react";
import { Crown, Shield, ShieldCheck } from "lucide-react";
import { ROLE_META } from "../../data/constants";
import PricingModal from "../Modals/PricingModal";

export default function AccessDenied({ role, screen, onUpgrade }) {
  const [showPricing, setShowPricing] = useState(false);
  const requiredRole = ["analytics", "reports", "budgets"].includes(screen) ? "premium" : "admin";
  const meta = ROLE_META[requiredRole];
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-8">
      {showPricing && <PricingModal onClose={() => setShowPricing(false)} onUpgrade={onUpgrade} />}
      <div
        className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
        style={{
          background: meta.bg,
        }}
      >
        <Shield
          size={36}
          style={{
            color: meta.color,
          }}
        />
      </div>
      <h2 className="text-2xl font-bold font-['Poppins'] text-foreground mb-2">Access Restricted</h2>
      <p className="text-muted-foreground text-sm max-w-xs mb-2">
        This section requires a{" "}
        <span
          className="font-semibold"
          style={{
            color: meta.color,
          }}
        >
          {meta.label}
        </span>{" "}
        account.
      </p>
      <p className="text-xs text-muted-foreground mb-8 max-w-sm">{meta.description}</p>
      <button
        onClick={() => setShowPricing(true)}
        className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-semibold transition hover:opacity-90"
        style={{
          background: `linear-gradient(135deg, ${meta.color}, ${meta.color}cc)`,
        }}
      >
        {requiredRole === "premium" ? <Crown size={14} /> : <ShieldCheck size={14} />}
        Upgrade to {meta.label}
      </button>
      <p className="text-xs text-muted-foreground mt-6">
        You are signed in as <span className="font-semibold text-foreground">{ROLE_META[role].label}</span>
      </p>
    </div>
  );
}
