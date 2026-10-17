import { AuthProvider } from "./context/AuthContext";
import { useEffect, useState } from "react";
import { useAuth } from "./context/useAuth";
import AdminDashboard from "./admin/AdminDashboard";
import AuthPage from "./authentication/AuthPage";
import Income from "./income/Income";
import ProfilePage from "./profile/ProfilePage";

function AppContent() {
  const { currentUser, loading } = useAuth();
  const [pathname, setPathname] = useState(() => window.location.pathname);

  useEffect(() => {
    const updatePath = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", updatePath);
    return () => window.removeEventListener("popstate", updatePath);
  }, []);

  function navigate(path) {
    if (window.location.pathname !== path) {
      window.history.pushState({}, "", path);
      setPathname(path);
    }
  }

  if (loading) {
    return <main className="app-loading" role="status">Loading your account…</main>;
  }
  if (!currentUser) return <AuthPage />;
  if (pathname === "/profile") {
    return <ProfilePage onNavigate={navigate} />;
  }
  if (currentUser.role === "admin") {
    return <AdminDashboard onNavigate={navigate} />;
  }
  return <Income onNavigate={navigate} />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
