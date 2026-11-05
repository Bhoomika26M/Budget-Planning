import { useState } from "react";
import useSubmit from "../../hooks/useSubmit";
import FormError from "../Forms/FormError";
import Modal from "./Modal";
import Field from "../Forms/Field";
import Input from "../Forms/FormInput";
import { GOAL_COLORS } from "../../data/constants";
import PrimaryBtn from "../Buttons/PrimaryButton";

export default function GoalModal({ initial, onSave, onClose }) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [emoji, setEmoji] = useState(initial?.emoji ?? "🎯");
  const [target, setTarget] = useState(String(initial?.target ?? ""));
  const [saved, setSaved] = useState(String(initial?.saved ?? "0"));
  const [deadline, setDeadline] = useState(initial?.deadlineIso ?? "");
  const [quote, setQuote] = useState(initial?.quote ?? "");
  const [color, setColor] = useState(initial?.color ?? "#2E93C7");
  const { busy, error, setError, run } = useSubmit();
  async function save() {
    if (!title.trim()) {
      setError("Goal name is required.");
      return;
    }
    if (!target || Number(target) <= 0) {
      setError("Enter a valid target amount.");
      return;
    }
    if (Number(saved) < 0) {
      setError("Saved amount cannot be negative.");
      return;
    }
    if (Number(saved) > Number(target)) {
      setError("Saved amount cannot exceed the target.");
      return;
    }
    const ok = await run(() =>
      onSave({
        id: initial?.id,
        title: title.trim(),
        emoji: emoji.trim() || "🎯",
        target: Number(target),
        saved: Number(saved || 0),
        deadlineIso: deadline,
        quote: quote.trim() || "Keep going!",
        color,
      })
    );
    if (ok) onClose();
  }
  return (
    <Modal title={initial?.id ? "Edit Goal" : "New Savings Goal"} onClose={onClose}>
      <div className="space-y-4">
        <FormError message={error} />
        <div className="grid grid-cols-4 gap-3">
          <Field label="Emoji">
            <Input value={emoji} onChange={setEmoji} placeholder="🎯" />
          </Field>
          <div className="col-span-3">
            <Field label="Goal Name">
              <Input
                value={title}
                onChange={(v) => {
                  setTitle(v);
                  setError("");
                }}
                placeholder="e.g. Laptop Fund"
              />
            </Field>
          </div>
        </div>
        <Field label="Target Amount (₹)">
          <Input
            value={target}
            onChange={(v) => {
              setTarget(v);
              setError("");
            }}
            placeholder="e.g. 80000"
            type="number"
          />
        </Field>
        <Field label="Already Saved (₹)">
          <Input
            value={saved}
            onChange={(v) => {
              setSaved(v);
              setError("");
            }}
            placeholder="0"
            type="number"
          />
        </Field>
        {/* Progress preview */}
        {target && Number(target) > 0 && (
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Progress preview</span>
              <span className="font-medium text-foreground">
                {Math.min(Math.round((Number(saved) / Number(target)) * 100), 100)}%
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min((Number(saved) / Number(target)) * 100, 100)}%`,
                  background: color,
                }}
              />
            </div>
          </div>
        )}
        <Field label="Target Date">
          <Input value={deadline} onChange={setDeadline} type="date" />
        </Field>
        <Field label="Motivational Quote">
          <Input value={quote} onChange={setQuote} placeholder="Optional" />
        </Field>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Goal Colour</label>
          <div className="flex gap-2 flex-wrap">
            {GOAL_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className="w-7 h-7 rounded-full transition-all hover:scale-110"
                style={{
                  background: c,
                  outline: color === c ? `3px solid ${c}` : "none",
                  outlineOffset: "2px",
                  boxShadow: color === c ? `0 0 0 2px white, 0 0 0 4px ${c}` : "none",
                }}
              />
            ))}
          </div>
        </div>
        <PrimaryBtn onClick={save} disabled={busy}>
          {busy ? "Saving…" : initial?.id ? "Save Changes" : "Create Goal"}
        </PrimaryBtn>
      </div>
    </Modal>
  );
}
