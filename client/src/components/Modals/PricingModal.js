import { useState } from "react";
import { ArrowLeft, CheckCircle, ChevronRight, Crown, GraduationCap, Shield, X } from "lucide-react";
import { ROLE_META } from "../../data/constants";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import { toProfile } from "../../services/mappers";

// ══════════════════════════════════════════════════════════════════
// SCREENS
// ══════════════════════════════════════════════════════════════════

// ── Access Denied component ────────────────────────────────────────
// ── Pricing Modal ─────────────────────────────────────────────────

export function PayBackdrop({ children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: "rgba(12,42,69,0.75)",
        backdropFilter: "blur(6px)",
      }}
    >
      {children}
    </div>
  );
}

export function PayModalShell({ title, sub, onBack, onClose, children }) {
  return (
    <div className="bg-card rounded-3xl shadow-2xl w-full max-w-md border border-border overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-border">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
          >
            <ArrowLeft size={15} />
          </button>
        )}
        <div className="flex-1">
          <h2 className="text-base font-bold font-['Poppins'] text-foreground">{title}</h2>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
        >
          <X size={15} />
        </button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

export function PayBtn({ onClick, disabled, processing, children }) {
  const premiumColor = ROLE_META.premium.color;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || processing}
      className="w-full py-3 rounded-xl text-white text-sm font-semibold mt-4 transition hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
      style={{
        background: `linear-gradient(135deg, ${premiumColor}, ${premiumColor}cc)`,
      }}
    >
      {processing ? (
        <>
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{" "}
          Processing…
        </>
      ) : (
        children
      )}
    </button>
  );
}

export function PayOrderSummary() {
  const premiumColor = ROLE_META.premium.color;
  return (
    <div
      className="flex items-center justify-between p-3 rounded-xl mb-5 border border-border"
      style={{
        background: ROLE_META.premium.bg,
      }}
    >
      <div className="flex items-center gap-2">
        <Crown
          size={16}
          style={{
            color: premiumColor,
          }}
        />
        <div>
          <p className="text-sm font-semibold text-foreground">BudgetBuddy Premium</p>
          <p className="text-xs text-muted-foreground">Monthly subscription · demo checkout</p>
        </div>
      </div>
      <p
        className="text-base font-bold"
        style={{
          color: premiumColor,
        }}
      >
        ₹299
      </p>
    </div>
  );
}

export default function PricingModal({ onClose, onUpgrade }) {
  const [step, setStep] = useState("plans");
  const [upiId, setUpiId] = useState("");
  const [upiError, setUpiError] = useState("");
  const [cardNum, setCardNum] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardError, setCardError] = useState("");
  const [bank, setBank] = useState("");
  const [wallet, setWallet] = useState("");
  const [processing, setProcessing] = useState(false);
  const [payError, setPayError] = useState("");
  const [upgradedUser, setUpgradedUser] = useState(null);
  const { setUser } = useAuth();
  const premiumColor = ROLE_META.premium.color;

  // Payments are simulated (no gateway is charged). After a short
  // "processing" delay the backend upgrades the account to Premium.
  async function simulatePay() {
    setProcessing(true);
    setPayError("");
    try {
      const [updated] = await Promise.all([api.upgrade(step), new Promise((r) => setTimeout(r, 1200))]);
      setUpgradedUser(updated);
      setStep("success");
    } catch (err) {
      setPayError(err.message || "Payment failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  }
  function handleSuccess() {
    // Applying the new role re-renders the app with Premium features unlocked.
    if (upgradedUser) setUser(toProfile(upgradedUser));
    onUpgrade?.(upgradedUser);
    onClose();
  }

  // ── Step: Plans ──
  if (step === "plans")
    return (
      <PayBackdrop>
        <div className="bg-card rounded-3xl shadow-2xl w-full max-w-2xl border border-border overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-border">
            <div>
              <h2 className="text-xl font-bold font-['Poppins'] text-foreground">Upgrade Your Plan</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Unlock powerful features to take control of your finances
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-secondary text-muted-foreground transition-colors"
            >
              <X size={16} />
            </button>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                name: "Student",
                price: "Free",
                period: "",
                color: ROLE_META.student.color,
                bg: ROLE_META.student.bg,
                icon: GraduationCap,
                features: [
                  "Expense tracking",
                  "Income management",
                  "Basic savings goals",
                  "Notifications",
                  "Profile & settings",
                ],
                locked: ["Budget planning", "CSV / PDF export", "Analytics", "Reports", "AI Insights"],
                cta: "Current Plan",
                disabled: true,
              },
              {
                name: "Premium",
                price: "₹299",
                period: "/ month",
                color: premiumColor,
                bg: ROLE_META.premium.bg,
                icon: Crown,
                badge: "Most Popular",
                features: [
                  "Everything in Student",
                  "Budget planning & allocation",
                  "CSV & PDF export",
                  "Advanced analytics",
                  "Full reports",
                  "AI Insights",
                  "Cash flow analysis",
                  "Delete records",
                ],
                locked: [],
                cta: "Upgrade to Premium",
                disabled: false,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className="relative rounded-2xl border-2 p-5 flex flex-col gap-4"
                style={{
                  borderColor: plan.color + (plan.badge ? "ff" : "30"),
                  background: plan.badge ? plan.bg : "var(--card)",
                }}
              >
                {plan.badge && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[11px] font-bold text-white"
                    style={{
                      background: plan.color,
                    }}
                  >
                    {plan.badge}
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: plan.color,
                    }}
                  >
                    <plan.icon size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="text-base font-bold font-['Poppins'] text-foreground">{plan.name}</p>
                    <p>
                      <span
                        className="text-xl font-bold"
                        style={{
                          color: plan.color,
                        }}
                      >
                        {plan.price}
                      </span>
                      <span className="text-xs text-muted-foreground">{plan.period}</span>
                    </p>
                  </div>
                </div>
                <ul className="space-y-2 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-foreground">
                      <CheckCircle
                        size={13}
                        style={{
                          color: plan.color,
                        }}
                        className="shrink-0"
                      />
                      {f}
                    </li>
                  ))}
                  {plan.locked.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground/40">
                      <X size={13} className="shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  disabled={plan.disabled}
                  onClick={() => !plan.disabled && setStep("method")}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold transition hover:opacity-90 disabled:opacity-50 disabled:cursor-default"
                  style={
                    plan.disabled
                      ? {
                          background: "var(--secondary)",
                          color: "var(--muted-foreground)",
                        }
                      : {
                          background: `linear-gradient(135deg,${plan.color},${plan.color}cc)`,
                          color: "#fff",
                        }
                  }
                >
                  {plan.disabled ? (
                    plan.cta
                  ) : (
                    <span className="flex items-center justify-center gap-1.5">
                      <Crown size={13} />
                      {plan.cta}
                    </span>
                  )}
                </button>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground pb-5">
            Demo checkout — no real money is charged · Cancel anytime
          </p>
        </div>
      </PayBackdrop>
    );

  // ── Step: Payment Method ──
  if (step === "method")
    return (
      <PayBackdrop>
        <PayModalShell
          title="Choose Payment Method"
          sub="₹299 / month — BudgetBuddy Premium"
          onBack={() => setStep("plans")}
          onClose={onClose}
        >
          <PayOrderSummary />
          {payError && <p className="text-xs text-red-500 -mt-2 mb-3">{payError}</p>}
          <div className="space-y-3">
            {[
              {
                id: "upi",
                label: "UPI",
                sub: "GPay, PhonePe, Paytm, BHIM",
                icon: "🔗",
              },
              {
                id: "card",
                label: "Credit / Debit Card",
                sub: "Visa, Mastercard, RuPay",
                icon: "💳",
              },
              {
                id: "netbanking",
                label: "Net Banking",
                sub: "All major Indian banks",
                icon: "🏦",
              },
              {
                id: "wallet",
                label: "Mobile Wallet",
                sub: "Paytm, Amazon Pay, PhonePe",
                icon: "👛",
              },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setStep(m.id)}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border border-border hover:border-primary/40 hover:bg-secondary/30 transition-all group"
              >
                <span className="text-2xl">{m.icon}</span>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    {m.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{m.sub}</p>
                </div>
                <ChevronRight
                  size={16}
                  className="text-muted-foreground group-hover:text-primary transition-colors"
                />
              </button>
            ))}
          </div>
          <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground mt-5">
            <Shield size={11} className="text-green-500" /> 256-bit SSL encrypted · PCI DSS compliant
          </p>
        </PayModalShell>
      </PayBackdrop>
    );

  // ── Step: UPI ──
  if (step === "upi")
    return (
      <PayBackdrop>
        <PayModalShell
          title="Pay via UPI"
          sub="Enter your UPI ID to proceed"
          onBack={() => setStep("method")}
          onClose={onClose}
        >
          <PayOrderSummary />
          {payError && <p className="text-xs text-red-500 -mt-2 mb-3">{payError}</p>}
          <div className="space-y-4">
            <div className="flex gap-3 justify-center mb-2">
              {["🔵 GPay", "🟣 PhonePe", "🔷 Paytm", "🇮🇳 BHIM"].map((app) => (
                <div key={app} className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-lg">
                    {app.split(" ")[0]}
                  </div>
                  <p className="text-[9px] text-muted-foreground">{app.split(" ")[1]}</p>
                </div>
              ))}
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">UPI ID</label>
              <input
                value={upiId}
                onChange={(e) => {
                  setUpiId(e.target.value);
                  setUpiError("");
                }}
                placeholder="yourname@upi or 9999999999@paytm"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              {upiError && <p className="text-xs text-red-500 mt-1">{upiError}</p>}
            </div>
            <PayBtn
              processing={processing}
              onClick={() => {
                if (!upiId.includes("@")) {
                  setUpiError("Enter a valid UPI ID (e.g. name@upi)");
                  return;
                }
                simulatePay();
              }}
            >
              Pay ₹299
            </PayBtn>
          </div>
        </PayModalShell>
      </PayBackdrop>
    );

  // ── Step: Card ──
  if (step === "card")
    return (
      <PayBackdrop>
        <PayModalShell
          title="Credit / Debit Card"
          sub="Enter your card details"
          onBack={() => setStep("method")}
          onClose={onClose}
        >
          <PayOrderSummary />
          {payError && <p className="text-xs text-red-500 -mt-2 mb-3">{payError}</p>}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">Card Number</label>
              <input
                value={cardNum}
                onChange={(e) => {
                  setCardNum(
                    e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 16)
                      .replace(/(.{4})/g, "$1 ")
                      .trim(),
                  );
                  setCardError("");
                }}
                placeholder="1234 5678 9012 3456"
                maxLength={19}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-input-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1.5">Cardholder Name</label>
              <input
                value={cardName}
                onChange={(e) => {
                  setCardName(e.target.value);
                  setCardError("");
                }}
                placeholder="Name on card"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">Expiry (MM/YY)</label>
                <input
                  value={cardExp}
                  onChange={(e) => {
                    let v = e.target.value.replace(/\D/g, "").slice(0, 4);
                    if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2);
                    setCardExp(v);
                    setCardError("");
                  }}
                  placeholder="MM/YY"
                  maxLength={5}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-input-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">CVV</label>
                <input
                  value={cardCvv}
                  onChange={(e) => {
                    setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4));
                    setCardError("");
                  }}
                  placeholder="•••"
                  maxLength={4}
                  type="password"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-input-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
            {cardError && <p className="text-xs text-red-500">{cardError}</p>}
            <PayBtn
              processing={processing}
              onClick={() => {
                const num = cardNum.replace(/\s/g, "");
                if (num.length < 16) {
                  setCardError("Enter a valid 16-digit card number");
                  return;
                }
                if (!cardName.trim()) {
                  setCardError("Enter cardholder name");
                  return;
                }
                if (cardExp.length < 5) {
                  setCardError("Enter expiry in MM/YY format");
                  return;
                }
                if (cardCvv.length < 3) {
                  setCardError("Enter a valid CVV");
                  return;
                }
                simulatePay();
              }}
            >
              Pay ₹299
            </PayBtn>
          </div>
        </PayModalShell>
      </PayBackdrop>
    );

  // ── Step: Net Banking ──
  if (step === "netbanking")
    return (
      <PayBackdrop>
        <PayModalShell
          title="Net Banking"
          sub="Select your bank to continue"
          onBack={() => setStep("method")}
          onClose={onClose}
        >
          <PayOrderSummary />
          {payError && <p className="text-xs text-red-500 -mt-2 mb-3">{payError}</p>}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {["SBI", "HDFC", "ICICI", "Axis", "Kotak", "PNB", "Bank of Baroda", "Canara Bank"].map((b) => (
              <button
                type="button"
                key={b}
                onClick={() => setBank(b)}
                className={`p-3 rounded-xl border text-sm font-medium transition-all text-left ${bank === b ? "border-primary bg-primary/5 text-primary" : "border-border hover:bg-secondary text-foreground"}`}
              >
                🏦 {b}
              </button>
            ))}
          </div>
          <div>
            <label className="text-xs font-medium text-foreground block mb-1.5">Or enter bank name</label>
            <input
              value={bank}
              onChange={(e) => setBank(e.target.value)}
              placeholder="Search bank..."
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-input-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <PayBtn
            processing={processing}
            onClick={() => {
              if (!bank.trim()) return;
              simulatePay();
            }}
          >
            Proceed to {bank || "Bank"} →
          </PayBtn>
        </PayModalShell>
      </PayBackdrop>
    );

  // ── Step: Wallet ──
  if (step === "wallet")
    return (
      <PayBackdrop>
        <PayModalShell
          title="Mobile Wallet"
          sub="Choose your wallet"
          onBack={() => setStep("method")}
          onClose={onClose}
        >
          <PayOrderSummary />
          {payError && <p className="text-xs text-red-500 -mt-2 mb-3">{payError}</p>}
          <div className="space-y-3">
            {[
              {
                id: "Paytm",
                icon: "🔵",
                sub: "Add money & pay via Paytm wallet",
              },
              {
                id: "Amazon Pay",
                icon: "🟡",
                sub: "Pay using Amazon Pay balance",
              },
              {
                id: "PhonePe",
                icon: "🟣",
                sub: "PhonePe wallet balance",
              },
              {
                id: "Mobikwik",
                icon: "🔴",
                sub: "Pay using Mobikwik SuperCash",
              },
            ].map((w) => (
              <button
                type="button"
                key={w.id}
                onClick={() => setWallet(w.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${wallet === w.id ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/30"}`}
              >
                <span className="text-2xl">{w.icon}</span>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-foreground">{w.id}</p>
                  <p className="text-xs text-muted-foreground">{w.sub}</p>
                </div>
                {wallet === w.id && <CheckCircle size={16} className="text-primary shrink-0" />}
              </button>
            ))}
          </div>
          <PayBtn
            processing={processing}
            onClick={() => {
              if (!wallet) return;
              simulatePay();
            }}
          >
            Pay ₹299 via {wallet || "Wallet"}
          </PayBtn>
        </PayModalShell>
      </PayBackdrop>
    );

  // ── Step: Success ──
  if (step === "success")
    return (
      <PayBackdrop>
        <div className="bg-card rounded-3xl shadow-2xl w-full max-w-sm border border-border overflow-hidden">
          <div className="flex flex-col items-center text-center p-8 gap-4">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mb-2"
              style={{
                background: "linear-gradient(135deg,#22c55e,#16a34a)",
              }}
            >
              <CheckCircle size={40} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold font-['Poppins'] text-foreground">Payment Successful!</h2>
            <p className="text-sm text-muted-foreground">
              Welcome to BudgetBuddy Premium. Your account has been upgraded.
            </p>
            <div
              className="w-full p-4 rounded-2xl border border-border mt-2"
              style={{
                background: ROLE_META.premium.bg,
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Plan</span>
                <span
                  className="text-sm font-semibold"
                  style={{
                    color: premiumColor,
                  }}
                >
                  Premium
                </span>
              </div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Amount Paid</span>
                <span className="text-sm font-semibold text-foreground">₹299</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Next Billing</span>
                <span className="text-sm font-semibold text-foreground">
                  {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
            <button
              onClick={handleSuccess}
              className="w-full py-3 rounded-xl text-white text-sm font-semibold mt-2 transition hover:opacity-90"
              style={{
                background: `linear-gradient(135deg,${premiumColor},${premiumColor}cc)`,
              }}
            >
              <span className="flex items-center justify-center gap-2">
                <Crown size={15} /> Start Exploring Premium
              </span>
            </button>
          </div>
        </div>
      </PayBackdrop>
    );
  return null;
}
