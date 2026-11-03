import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// ── Date Picker ────────────────────────────────────────────────────
export default function DatePicker({ value, onChange, onClose }) {
  const MONTHS_FULL = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const parseDate = (s) => {
    const [y, m, d] = s.split("-").map(Number);
    return {
      year: y,
      month: m - 1,
      day: d,
    };
  };
  const sel = parseDate(value);
  const now = new Date();
  const [viewYear, setViewYear] = useState(sel.year);
  const [viewMonth, setViewMonth] = useState(sel.month);
  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  }

  // Days in this view month
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun

  const cells = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from(
      {
        length: daysInMonth,
      },
      (_, i) => i + 1,
    ),
  ];
  // Pad to full rows
  while (cells.length % 7 !== 0) cells.push(null);
  function selectDay(day) {
    const s = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    onChange(s);
    onClose();
  }
  function jumpToday() {
    const s = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    onChange(s);
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    onClose();
  }
  return (
    <div
      className="absolute top-full right-0 mt-2 z-50 w-72 bg-card rounded-2xl shadow-2xl border border-border overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b border-border"
        style={{
          background: "linear-gradient(135deg, #0C2A45, #0D6D91)",
        }}
      >
        <button
          onClick={prevMonth}
          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          <ChevronLeft size={14} />
        </button>
        <span className="text-sm font-semibold text-white font-['Poppins']">
          {MONTHS_FULL[viewMonth]} {viewYear}
        </span>
        <button
          onClick={nextMonth}
          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="p-3">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAYS.map((d) => (
            <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-0.5">
          {cells.map((day, idx) => {
            if (day === null) return <div key={`e-${idx}`} />;
            const isSelected = day === sel.day && viewMonth === sel.month && viewYear === sel.year;
            const isToday =
              day === now.getDate() && viewMonth === now.getMonth() && viewYear === now.getFullYear();
            const isSun = idx % 7 === 0;
            const isSat = idx % 7 === 6;
            return (
              <button
                key={day}
                onClick={() => selectDay(day)}
                className="h-8 w-full rounded-lg text-xs font-medium transition-all hover:scale-110 flex items-center justify-center"
                style={
                  isSelected
                    ? {
                        background: "linear-gradient(135deg, #2E93C7, #0D6D91)",
                        color: "#fff",
                        fontWeight: 700,
                      }
                    : isToday
                      ? {
                          background: "var(--secondary)",
                          color: "var(--primary)",
                          fontWeight: 700,
                          border: "1.5px solid var(--primary)",
                        }
                      : {
                          color: isSun ? "#e53e3e" : isSat ? "#2E93C7" : "var(--foreground)",
                        }
                }
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-border flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">
          {value
            ? new Date(value + "T00:00:00").toLocaleDateString("en-IN", {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : ""}
        </span>
        <button onClick={jumpToday} className="text-xs text-primary font-semibold hover:underline">
          Today
        </button>
      </div>
    </div>
  );
}
