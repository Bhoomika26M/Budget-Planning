import { useState } from "react";

import { EXPENSE_STATUSES } from "../../data/constants";
import { useFinance } from "../../context/FinanceContext";
import useSubmit from "../../hooks/useSubmit";
import { toISODate } from "../../utils/formatDate";
import PrimaryBtn from "../Buttons/PrimaryButton";
import Field from "../Forms/Field";
import FormError from "../Forms/FormError";
import Input from "../Forms/FormInput";
import Select from "../Forms/FormSelect";
import Modal from "./Modal";

// ── Expense Modal ──────────────────────────────────────────────────
export default function ExpenseModal({ initial, onSave, onClose }) {
  const { categories } = useFinance();
  const [desc, setDesc] = useState(initial?.desc ?? "");
  const [cat, setCat] = useState(initial?.cat ?? categories[0]);
  const [amount, setAmount] = useState(String(initial?.amount ?? ""));
  const [date, setDate] = useState(initial?.dateIso ?? toISODate());
  const [status, setStatus] = useState(initial?.status ?? "Completed");
  const { busy, error, setError, run } = useSubmit();

  async function save() {
    if (!desc.trim()) return setError("Please enter a description.");
    if (!amount || Number(amount) <= 0) return setError("Enter an amount greater than 0.");
    if (!date) return setError("Please pick a date.");
    const ok = await run(() =>
      onSave({ id: initial?.id, desc: desc.trim(), cat, amount: Number(amount), dateIso: date, status })
    );
    if (ok) onClose();
  }

  return (
    <Modal title={initial?.id ? "Edit Expense" : "Add Expense"} onClose={onClose}>
      <div className="space-y-4">
        <FormError message={error} />
        <Field label="Description">
          <Input value={desc} onChange={setDesc} placeholder="e.g. Zomato Order" autoFocus />
        </Field>
        <Field label="Category">
          <Select value={cat} onChange={setCat} options={categories} />
        </Field>
        <Field label="Amount (₹)">
          <Input value={amount} onChange={setAmount} placeholder="e.g. 320" type="number" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date">
            <Input value={date} onChange={setDate} type="date" max={toISODate()} />
          </Field>
          <Field label="Status">
            <Select value={status} onChange={setStatus} options={EXPENSE_STATUSES} />
          </Field>
        </div>
        <PrimaryBtn onClick={save} disabled={busy}>
          {busy ? "Saving…" : initial?.id ? "Save Changes" : "Add Expense"}
        </PrimaryBtn>
      </div>
    </Modal>
  );
}
