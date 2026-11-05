import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle } from "lucide-react";

const ToastContext = createContext({ notify: () => {} });

/** App-wide toast in the design's style (bottom-right gradient pill). */
export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);

  const notify = useCallback((msg, type = "success") => {
    clearTimeout(timer.current);
    setToast({ msg, type });
    timer.current = setTimeout(() => setToast(null), type === "error" ? 4500 : 3000);
  }, []);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-[60] max-w-sm px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg flex items-center gap-2"
          style={{
            background:
              toast.type === "error"
                ? "linear-gradient(135deg, #e53e3e, #c53030)"
                : "linear-gradient(135deg, #2E93C7, #0D6D91)",
          }}
        >
          {toast.type === "error" ? <AlertTriangle size={14} className="shrink-0" /> : <CheckCircle size={14} className="shrink-0" />}
          {toast.msg}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
