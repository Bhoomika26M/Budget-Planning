import React, { useMemo, useState } from "react";
import { Bell, Calendar, CreditCard, Crown, GraduationCap, LogOut, Menu, Moon, Search, Settings, ShieldCheck, Sun, Target, TrendingUp, User } from "lucide-react";

import DatePicker from "../components/Forms/DatePicker";
import { ROLE_META } from "../data/constants";
import { navItems } from "../data/navigation";
import { useFinance } from "../context/FinanceContext";
import useScreenNavigate from "../hooks/useScreenNavigate";
import { parseISODate } from "../utils/formatDate";
import getInitials from "../utils/getInitials";

function GlobalSearch() {
  const { expenses, incomeList, goals } = useFinance();
  const navigate = useScreenNavigate();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return [
      ...expenses
        .filter((e) => `${e.desc} ${e.cat}`.toLowerCase().includes(q))
        .map((e) => ({ key: `e${e.id}`, icon: CreditCard, label: e.desc, sub: `${e.cat} · ${e.date}`, amount: `-₹${e.amount.toLocaleString()}`, screen: "expenses" })),
      ...incomeList
        .filter((i) => i.source.toLowerCase().includes(q))
        .map((i) => ({ key: `i${i.id}`, icon: TrendingUp, label: i.source, sub: i.date, amount: `+₹${i.amount.toLocaleString()}`, screen: "income" })),
      ...goals
        .filter((g) => g.title.toLowerCase().includes(q))
        .map((g) => ({ key: `g${g.id}`, icon: Target, label: `${g.emoji} ${g.title}`, sub: `₹${g.saved.toLocaleString()} of ₹${g.target.toLocaleString()}`, amount: "", screen: "savings" })),
    ].slice(0, 8);
  }, [query, expenses, incomeList, goals]);

  return (
    <div className="flex-1 max-w-md relative hidden sm:block">
      <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        placeholder="Search transactions, goals..."
        className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-input-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
      />
      {open && query.trim() && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 top-11 z-50 bg-card border border-border rounded-xl shadow-lg overflow-hidden py-1">
            {results.length === 0 && <p className="px-3 py-3 text-xs text-muted-foreground">No matches for “{query}”.</p>}
            {results.map((r) => (
              <button
                key={r.key}
                onClick={() => {
                  navigate(r.screen);
                  setOpen(false);
                  setQuery("");
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-secondary transition-colors"
              >
                <r.icon size={14} className="text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{r.label}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{r.sub}</p>
                </div>
                <span className="text-xs font-semibold text-foreground shrink-0">{r.amount}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function Navbar({ user, screen, dark, setDark, onMenu, onLogout, unreadCount }) {
  const navigate = useScreenNavigate();
  const { selectedDate, setSelectedDate } = useFinance();
  const [calOpen, setCalOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const role = user?.role ?? "student";
  const isAdmin = role === "admin";

  return (
    <header className="sticky top-0 z-30 bg-card border-b border-border px-6 py-3 flex items-center gap-4">
      <button onClick={onMenu} className="lg:hidden text-muted-foreground hover:text-foreground" aria-label="Open menu">
        <Menu size={20} />
      </button>
      {isAdmin ? (
        <p className="text-base font-semibold font-['Poppins'] text-foreground">
          {navItems.find((n) => n.id === screen)?.label ?? "Admin Panel"}
        </p>
      ) : (
        <GlobalSearch />
      )}
      <div className="ml-auto flex items-center gap-3">
        {!isAdmin && (
          <div className="relative hidden md:flex">
            <button
              onClick={() => setCalOpen((v) => !v)}
              title="Choose the month shown on Dashboard and Budgets"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-input-background text-sm text-foreground hover:bg-secondary transition-colors cursor-pointer select-none"
            >
              <Calendar size={14} className="text-muted-foreground" />
              <span>
                {parseISODate(selectedDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            </button>
            {calOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setCalOpen(false)} />
                <div className="z-50">
                  <DatePicker value={selectedDate} onChange={setSelectedDate} onClose={() => setCalOpen(false)} />
                </div>
              </>
            )}
          </div>
        )}
        <button
          onClick={() => setDark(!dark)}
          aria-label="Toggle dark mode"
          className="w-9 h-9 rounded-xl border border-border bg-input-background flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          {dark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        {!isAdmin && (
          <button
            onClick={() => navigate("notifications")}
            aria-label="Notifications"
            className="relative w-9 h-9 rounded-xl border border-border bg-input-background flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <Bell size={16} />
            {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />}
          </button>
        )}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen((v) => !v)}
            aria-label="Account menu"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold hover:opacity-90 transition-opacity"
            style={{ background: "linear-gradient(135deg, #2E93C7, #0D6D91)" }}
          >
            {getInitials(user?.name)}
          </button>
          {userMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
              <div className="absolute right-0 top-11 z-50 w-48 bg-card border border-border rounded-xl shadow-lg overflow-hidden py-1">
                <div className="px-3 py-2.5 border-b border-border">
                  <p className="text-xs font-semibold text-foreground truncate">{user?.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
                  <span
                    className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                    style={{ background: ROLE_META[role].bg, color: ROLE_META[role].color }}
                  >
                    {role === "admin" && <ShieldCheck size={9} />}
                    {role === "premium" && <Crown size={9} />}
                    {role === "student" && <GraduationCap size={9} />}
                    {ROLE_META[role].label}
                  </span>
                </div>
                {!isAdmin &&
                  [
                    { label: "Profile", icon: User, screen: "profile" },
                    { label: "Settings", icon: Settings, screen: "settings" },
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={() => {
                        navigate(item.screen);
                        setUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
                    >
                      <item.icon size={14} className="text-muted-foreground" />
                      {item.label}
                    </button>
                  ))}
                <div className="border-t border-border mt-1 pt-1">
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={14} />
                    Logout
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
