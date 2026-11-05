import { TrendingUp, Wallet } from "lucide-react";

// ── Left panel (reused in login + register) ────────────────────────
export default function AuthPanel() {
  return (
    <div
      className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #0C2A45 0%, #0D6D91 50%, #2E93C7 100%)",
      }}
    >
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "radial-gradient(circle at 30% 70%, #5FA7D2, transparent 50%), radial-gradient(circle at 70% 20%, #B9D2E7, transparent 40%)",
        }}
      />
      <div className="relative z-10 flex flex-col justify-between p-12 w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Wallet size={22} className="text-white" />
          </div>
          <span className="text-white font-bold text-xl font-['Poppins']">BudgetBuddy</span>
        </div>
        <div>
          <div className="mb-10 flex justify-center">
            <div className="w-72 h-64 relative">
              <div className="absolute inset-0 rounded-3xl bg-white/10 border border-white/20" />
              <div className="absolute top-6 left-6 right-6 h-20 rounded-2xl bg-white/15 flex items-center px-5 gap-4">
                <div className="w-10 h-10 rounded-full bg-white/30 flex items-center justify-center">
                  <TrendingUp size={18} className="text-white" />
                </div>
                <div>
                  <div className="h-2.5 w-20 bg-white/40 rounded-full mb-2" />
                  <div className="h-2 w-14 bg-white/25 rounded-full" />
                </div>
                <span className="ml-auto text-white font-bold text-lg">+12.4%</span>
              </div>
              <div className="absolute bottom-6 left-6 right-6 flex gap-3">
                {[40, 65, 45, 80, 55, 90].map((h, i) => (
                  <div key={i} className="flex-1 flex items-end">
                    <div
                      className="w-full rounded-t-lg bg-white/25"
                      style={{
                        height: `${h}px`,
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <h2 className="text-white text-3xl font-bold font-['Poppins'] leading-tight mb-4">
            Take control of your
            <br />
            financial future
          </h2>
          <p className="text-blue-200 text-base leading-relaxed mb-8">
            Track expenses, plan budgets, and achieve savings goals with intelligent insights.
          </p>
          <div className="flex gap-3 flex-wrap">
            {["50k+ Users", "₹2Cr+ Tracked", "98% Satisfaction"].map((s) => (
              <div key={s} className="px-3 py-1.5 rounded-full bg-white/15 border border-white/20">
                <span className="text-white text-xs font-medium">{s}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-blue-300 text-sm">© 2025 BudgetBuddy. All rights reserved.</p>
      </div>
    </div>
  );
}
