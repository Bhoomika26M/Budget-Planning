// App shell: sidebar + header + routed screen (the Figma "root" layout).
import React, { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useFinance } from "../context/FinanceContext";
import { screenFromPath } from "../data/navigation";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

function readDark() {
  try {
    return localStorage.getItem("bb_dark") === "true";
  } catch {
    return false;
  }
}

export default function PageContainer() {
  const { user, logout } = useAuth();
  const { notifs } = useFinance();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dark, setDarkState] = useState(readDark);

  const screen = screenFromPath(location.pathname);
  const unreadCount = notifs.filter((n) => !n.read).length;

  function setDark(value) {
    setDarkState(value);
    try {
      localStorage.setItem("bb_dark", String(value));
    } catch {
      /* ignore */
    }
  }

  // Dark mode also applies to modals rendered at the document root.
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar
        user={user}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
        unreadCount={unreadCount}
      />

      {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          user={user}
          screen={screen}
          dark={dark}
          setDark={setDark}
          onMenu={() => setSidebarOpen(true)}
          onLogout={handleLogout}
          unreadCount={unreadCount}
        />
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          <Outlet context={{ dark, setDark }} />
        </main>
      </div>
    </div>
  );
}
