import { AlertTriangle } from "lucide-react";

/** Red inline error box used inside modals and forms. */
export default function FormError({ message }) {
  if (!message) return null;
  return (
    <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50 border border-red-100">
      <AlertTriangle size={13} className="text-red-500 shrink-0" />
      <p className="text-xs text-red-600">{message}</p>
    </div>
  );
}
