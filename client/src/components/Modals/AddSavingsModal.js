import { useState } from "react";

import useSubmit from "../../hooks/useSubmit";
import PrimaryBtn from "../Buttons/PrimaryButton";
import Field from "../Forms/Field";
import FormError from "../Forms/FormError";
import Input from "../Forms/FormInput";
import Modal from "./Modal";

export default function AddSavingsModal({ goal, onSave, onClose }) {
  const [amount, setAmount] = useState("");
  const { busy, error, setError, run } = useSubmit();
  const remaining = Math.max(goal.target - goal.saved, 0);

  async function save() {
    if (!amount || Number(amount) <= 0) return setError("Enter an amount greater than 0.");
    const ok = await run(() => onSave(Number(amount)));
    if (ok) onClose();
  }

  return (
    <Modal title={`Add Savings — ${goal.title}`} onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Current: ₹{goal.saved.toLocaleString()} / ₹{goal.target.toLocaleString()}
        </p>
        <FormError message={error} />
        <Field label="Amount to Add (₹)">
          <Input value={amount} onChange={setAmount} placeholder="e.g. 1000" type="number" autoFocus />
        </Field>
        {remaining > 0 && (
          <button type="button" onClick={() => setAmount(String(remaining))} className="text-xs text-primary font-medium hover:underline">
            Fill remaining ₹{remaining.toLocaleString()}
          </button>
        )}
        <PrimaryBtn onClick={save} disabled={busy}>
          {busy ? "Saving…" : "Add Savings"}
        </PrimaryBtn>
      </div>
    </Modal>
  );
}
