import { useState } from "react";
import { AlertTriangle } from "lucide-react";

import useSubmit from "../../hooks/useSubmit";
import { toISODate } from "../../utils/formatDate";
import PrimaryBtn from "../Buttons/PrimaryButton";
import Field from "../Forms/Field";
import FormError from "../Forms/FormError";
import Input from "../Forms/FormInput";
import Modal from "./Modal";

// ── Extend deadline Modal ──────────────────────────────────────────
export default function ExtendDeadlineModal({ goal, onSave, onClose }) {
  const [deadline, setDeadline] = useState("");
  const { busy, error, setError, run } = useSubmit();

  async function save() {
    if (!deadline) return setError("Pick a new target date.");
    if (deadline <= toISODate()) return setError("The new date must be in the future.");
    const ok = await run(() => onSave(deadline));
    if (ok) onClose();
  }

  return (
    <Modal title="Extend Target Date" onClose={onClose}>
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-200">
          <AlertTriangle size={14} className="text-amber-600 shrink-0" />
          <p className="text-xs text-amber-700">
            <span className="font-semibold">{goal.title}</span> deadline has passed. Set a new target date to
            keep it active.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Current: <span className="font-semibold text-foreground">{goal.deadline || "—"}</span>
        </p>
        <FormError message={error} />
        <Field label="New Target Date">
          <Input value={deadline} onChange={setDeadline} type="date" min={toISODate()} />
        </Field>
        <PrimaryBtn onClick={save} disabled={busy}>
          {busy ? "Saving…" : "Save New Date"}
        </PrimaryBtn>
      </div>
    </Modal>
  );
}
