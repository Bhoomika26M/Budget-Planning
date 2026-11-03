import { CheckCircle, X } from "lucide-react";
import { useEffect } from "react";
import Card from "../components/Cards/Card";
import { useFinance } from "../context/FinanceContext";

// ── Notifications ──────────────────────────────────────────────────
export default function NotificationsScreen() {
  const { notifs, loadNotifications, markNotifRead, markAllNotifsRead, deleteNotif } = useFinance();
  const unread = notifs.filter((n) => !n.read).length;

  // Fetch the latest alerts when the screen opens.
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-['Poppins'] text-foreground">Notifications</h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            {unread > 0 ? `${unread} unread notifications` : "All caught up!"}
          </p>
        </div>
        {unread > 0 && (
          <button
            onClick={markAllNotifsRead}
            className="text-sm text-primary font-medium hover:underline"
          >
            Mark all read
          </button>
        )}
      </div>
      <div className="space-y-3">
        {notifs.map((n) => (
          <Card
            key={n.id}
            className={`p-4 flex items-start gap-4 transition-all cursor-pointer hover:shadow-md ${!n.read ? "border-l-4" : ""}`}
            style={
              !n.read
                ? {
                    borderLeftColor: n.color,
                  }
                : {}
            }
            onClick={() => !n.read && markNotifRead(n.id)}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: `${n.color}15`,
              }}
            >
              <n.icon
                size={18}
                style={{
                  color: n.color,
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">{n.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{n.body}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!n.read && <div className="w-2 h-2 rounded-full bg-primary" />}
                  <button
                    aria-label="Dismiss notification"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotif(n.id);
                    }}
                    className="p-1 rounded-lg hover:bg-secondary text-muted-foreground transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{n.time}</p>
            </div>
          </Card>
        ))}
        {notifs.length === 0 && (
          <Card className="p-12 text-center">
            <CheckCircle size={40} className="text-green-500 mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground">All clear!</p>
            <p className="text-xs text-muted-foreground mt-1">No notifications to show.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
