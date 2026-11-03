import { useState } from "react";

import { FREQS, INCOME_SOURCES } from "../../data/constants";
import useSubmit from "../../hooks/useSubmit";
import { toISODate } from "../../utils/formatDate";
import PrimaryBtn from "../Buttons/PrimaryButton";
import Field from "../Forms/Field";
import FormError from "../Forms/FormError";
import Input from "../Forms/FormInput";
import Select from "../Forms/FormSelect";
import Modal from "./Modal";

// ── Income Modal ───────────────────────────────────────────────────
export default function IncomeModal({ initial, onSave, onClose }) {
  const [source, setSource] = useState(initial?.source ?? INCOME_SOURCES[0]);
  const [amount, setAmount] = useState(String(initial?.amount ?? ""));
  const [date, setDate] = useState(initial?.dateIso ?? toISODate());
  const [freq, setFreq] = useState(initial?.freq ?? FREQS[0]);
  const { busy, error, setError, run } = useSubmit();

  async function save() {
    if (!amount || Number(amount) <= 0) return setError("Enter an amount greater than 0.");
    if (!date) return setError("Please pick a date.");
    const ok = await run(() => onSave({ id: initial?.id, source, amount: Number(amount), dateIso: date, freq }));
    if (ok) onClose();
  }

  return (
    <Modal title={initial?.id ? "Edit Income" : "Add Income"} onClose={onClose}>
      <div className="space-y-4">
        <FormError message={error} />
        <Field label="Source">
          <Select value={source} onChange={setSource} options={INCOME_SOURCES} />
        </Field>
        <Field label="Amount (₹)">
          <Input value={amount} onChange={setAmount} placeholder="e.g. 8000" type="number" autoFocus />
        </Field>
        <Field label="Date">
          <Input value={date} onChange={setDate} type="date" />
        </Field>
        <Field label="Frequency">
          <Select value={freq} onChange={setFreq} options={FREQS} />
        </Field>
        <PrimaryBtn onClick={save} disabled={busy}>
          {busy ? "Saving…" : initial?.id ? "Save Changes" : "Add Income"}
        </PrimaryBtn>
      </div>
    </Modal>
  );
}
