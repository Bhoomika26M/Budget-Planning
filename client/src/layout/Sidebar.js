import React from "react";
import { NavLink } from "react-router-dom";
import { Crown, GraduationCap, LogOut, ShieldCheck, Wallet, X } from "lucide-react";

import { ROLE_META } from "../data/constants";
import { SCREEN_PATHS, navItems } from "../data/navigation";
import getInitials from "../utils/getInitials";
import { ROLE_SCREENS } from "../utils/permissions";

export default function Sidebar({ user, open, onClose, onLogout, unreadCount = 0 }) {
  const role = user?.role ?? "student";
  const items = navItems.filter((item) => ROLE_SCREENS[role]?.includes(item.id));

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-64 h-screen flex flex-col transition-transform duration-300 lg:sticky lg:top-0 lg:translate-x-0 lg:self-start ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
      style={{ background: "linear-gradient(180deg, #0C2A45 0%, #143452 100%)" }}
    >
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
        <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
          <Wallet size={18} className="text-white" />
        </div>
        <span className="text-white font-bold text-lg font-['Poppins']">BudgetBuddy</span>
        <button onClick={onClose} className="lg:hidden ml-auto text-white/60 hover:text-white" aria-label="Close menu">
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        {role === "admin" && (
          <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-white/40">Admin Panel</p>
        )}
        <div className="space-y-1">
          {items.map((item) => (
            <NavLink
              key={item.id}
              to={SCREEN_PATHS[item.id]}
              end={SCREEN_PATHS[item.id] === "/"}
              onClick={onClose}
              className={({ isActive }) =>
                `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                  isActive ? "" : "hover:bg-white/5"
                }`
              }
              style={({ isActive }) => (isActive ? { background: "linear-gradient(135deg, #2E93C7, #0D6D91)" } : undefined)}
            >
              {({ isActive }) => (
                <>
                  <item.icon size={18} style={{ color: isActive ? "#fff" : "#93c5fd" }} />
                  <span className="text-sm font-medium" style={{ color: isActive ? "#fff" : "#bfdbfe" }}>
                    {item.label}
                  </span>
                  {item.id === "notifications" && unreadCount > 0 && (
                    <span className="ml-auto min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="px-3 pb-5 border-t border-white/10 pt-3 space-y-1">
        <div className="px-3 py-2">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
            style={{ background: ROLE_META[role].bg, color: ROLE_META[role].color }}
          >
            {role === "admin" && <ShieldCheck size={11} />}
            {role === "premium" && <Crown size={11} />}
            {role === "student" && <GraduationCap size={11} />}
            {ROLE_META[role].label}
          </span>
        </div>
        <div className="flex items-center gap-3 px-3 py-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{ background: "linear-gradient(135deg, #2E93C7, #0D6D91)" }}
          >
            {getInitials(user?.name)}
          </div>
          <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors hover:bg-white/5 group"
        >
          <LogOut size={18} className="text-blue-300 group-hover:text-red-400 transition-colors" />
          <span className="text-sm font-medium text-blue-200 group-hover:text-red-400 transition-colors">Logout</span>
        </button>
      </div>
    </aside>
  );
}
