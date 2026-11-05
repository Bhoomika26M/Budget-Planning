import { useState } from "react";
import { EXPENSE_STATUSES, STATUS_META } from "../../data/constants";

export default function StatusSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const meta = STATUS_META[value] ?? STATUS_META["Completed"];
  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer select-none transition-all hover:ring-2 hover:ring-offset-1"
        style={{
          background: `${meta.color}18`,
          color: meta.color,
          border: `1px solid ${meta.color}40`,
        }}
      >
        <span>{meta.icon}</span>
        <span>{value}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" className="opacity-60">
          <path
            d="M2 3.5l3 3 3-3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-40 w-36 bg-card rounded-xl shadow-xl border border-border overflow-hidden">
            {EXPENSE_STATUSES.map((s) => {
              const m = STATUS_META[s];
              const isActive = s === value;
              return (
                <button
                  key={s}
                  onClick={() => {
                    onChange(s);
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium transition-colors hover:bg-secondary text-left"
                  style={{
                    color: m.color,
                    background: isActive ? `${m.color}10` : undefined,
                  }}
                >
                  <span className="w-4">{m.icon}</span>
                  <span>{s}</span>
                  {isActive && <span className="ml-auto text-[10px] opacity-60">✓</span>}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
