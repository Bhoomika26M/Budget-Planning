import { useState } from "react";
import { AlertTriangle, MessageSquare } from "lucide-react";

import api from "../../services/api";
import Card from "./Card";

const inputClass =
  "w-full px-4 py-2.5 rounded-xl border border-border bg-input-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition";

/** Lets users send feedback or report a problem to the admins. */
export default function HelpFeedbackCard({ onDone, onError }) {
  const [tab, setTab] = useState("feedback");
  const [type, setType] = useState("suggestion");
  const [severity, setSeverity] = useState("medium");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (text.trim().length < 3) {
      onError("Please write a little more detail.");
      return;
    }
    setBusy(true);
    try {
      if (tab === "feedback") await api.sendFeedback(type, text.trim());
      else await api.reportIssue(text.trim(), severity);
      setText("");
      onDone(tab === "feedback" ? "Thanks for your feedback!" : "Issue reported — our team will look into it.");
    } catch (err) {
      onError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">Help &amp; Feedback</h3>
      <div className="flex gap-2 mb-4">
        {[
          { id: "feedback", label: "Send Feedback", icon: MessageSquare },
          { id: "issue", label: "Report a Problem", icon: AlertTriangle },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all"
            style={
              tab === t.id
                ? { background: "linear-gradient(135deg, #2E93C7, #0D6D91)", color: "#fff" }
                : { background: "var(--muted)", color: "var(--muted-foreground)" }
            }
          >
            <t.icon size={13} /> {t.label}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {tab === "feedback" ? (
          <select value={type} onChange={(e) => setType(e.target.value)} className={inputClass} aria-label="Feedback type">
            <option value="suggestion">💡 Suggestion</option>
            <option value="bug">🐞 Bug</option>
            <option value="praise">⭐ Praise</option>
          </select>
        ) : (
          <select value={severity} onChange={(e) => setSeverity(e.target.value)} className={inputClass} aria-label="Severity">
            <option value="low">Low severity</option>
            <option value="medium">Medium severity</option>
            <option value="high">High severity</option>
          </select>
        )}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder={tab === "feedback" ? "Tell us what you think…" : "What went wrong? Steps to reproduce help a lot."}
          className={`${inputClass} resize-none`}
        />
        <button
          onClick={submit}
          disabled={busy}
          className="px-5 py-2.5 rounded-xl text-white text-sm font-medium transition hover:opacity-90 disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, #2E93C7, #0D6D91)" }}
        >
          {busy ? "Sending…" : tab === "feedback" ? "Send Feedback" : "Report Problem"}
        </button>
      </div>
    </Card>
  );
}
