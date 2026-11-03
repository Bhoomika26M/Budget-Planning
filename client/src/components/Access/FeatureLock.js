import { useState } from "react";
import { Crown, Lock, ShieldCheck } from "lucide-react";
import { canDo } from "../../utils/permissions";
import { ROLE_META } from "../../data/constants";
import PricingModal from "../Modals/PricingModal";

// ── FeatureLock — wraps a card/section with a blurred upgrade gate ─
export default function FeatureLock({ role, feature, children, label, onUpgrade }) {
  const [showPricing, setShowPricing] = useState(false);
  if (canDo(role, feature)) return <>{children}</>;
  const requiredRole = feature === "manage_users" ? "admin" : "premium";
  const meta = ROLE_META[requiredRole];
  return (
    <div className="relative rounded-2xl overflow-hidden">
      {showPricing && <PricingModal onClose={() => setShowPricing(false)} onUpgrade={onUpgrade} />}
      <div
        className="pointer-events-none select-none"
        style={{
          filter: "blur(3px)",
          opacity: 0.4,
        }}
      >
        {children}
      </div>
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl"
        style={{
          background: `${meta.bg}e0`,
          backdropFilter: "blur(1px)",
        }}
      >
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{
            background: meta.color,
          }}
        >
          <Lock size={22} className="text-white" />
        </div>
        <div className="text-center px-4">
          <p
            className="text-sm font-bold font-['Poppins']"
            style={{
              color: meta.color,
            }}
          >
            {label ?? "Premium Feature"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Available on{" "}
            <span
              className="font-semibold"
              style={{
                color: meta.color,
              }}
            >
              {meta.label}
            </span>{" "}
            plan
          </p>
        </div>
        <button
          onClick={() => setShowPricing(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition hover:opacity-90"
          style={{
            background: meta.color,
            color: "#fff",
          }}
        >
          {requiredRole === "premium" ? <Crown size={12} /> : <ShieldCheck size={12} />}
          Upgrade to {meta.label}
        </button>
      </div>
    </div>
  );
}
