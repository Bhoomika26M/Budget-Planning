export default function ConfirmDialog({
  title,
  sub,
  body,
  confirmLabel = "Confirm",
  danger = false,
  onConfirm,
  onCancel,
  icon: Icon,
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: "rgba(12,42,69,0.6)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm border border-border p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${danger ? "bg-red-50" : "bg-primary/10"}`}
          >
            <Icon size={18} className={danger ? "text-red-500" : "text-primary"} />
          </div>
          <div>
            <h3 className="text-base font-semibold font-['Poppins'] text-foreground">{title}</h3>
            {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{body}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-secondary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition hover:opacity-90"
            style={{
              background: danger
                ? "linear-gradient(135deg,#e53e3e,#c53030)"
                : "linear-gradient(135deg,#2E93C7,#0D6D91)",
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
