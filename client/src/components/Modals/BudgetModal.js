import { useState } from "react";

import { colorForCategory } from "../../data/constants";
import { useFinance } from "../../context/FinanceContext";
import useSubmit from "../../hooks/useSubmit";
import PrimaryBtn from "../Buttons/PrimaryButton";
import Field from "../Forms/Field";
import FormError from "../Forms/FormError";
import Input from "../Forms/FormInput";
import Select from "../Forms/FormSelect";
import Modal from "./Modal";

// ── Budget Modal ───────────────────────────────────────────────────
// "Spent" is no longer typed in by hand: the server adds up the
// expenses of that category for the selected month.
export default function BudgetModal({ initial, onSave, onClose }) {
  const { categories, budgets } = useFinance();
  const taken = budgets.filter((b) => b.id !== initial?.id).map((b) => b.cat.toLowerCase());
  const available = categories.filter((c) => !taken.includes(c.toLowerCase()));
  const [cat, setCat] = useState(initial?.cat ?? available[0] ?? categories[0]);
  const [allocated, setAlloc] = useState(String(initial?.allocated ?? ""));
  const { busy, error, setError, run } = useSubmit();

  async function save() {
    if (!allocated || Number(allocated) <= 0) return setError("Enter a monthly limit greater than 0.");
    const index = Math.max(categories.indexOf(cat), 0);
    const ok = await run(() =>
      onSave({ id: initial?.id, cat, allocated: Number(allocated), color: initial?.color ?? colorForCategory(cat, index) })
    );
    if (ok) onClose();
  }

  return (
    <Modal title={initial?.cat ? "Edit Budget" : "Add Budget Category"} onClose={onClose}>
      <div className="space-y-4">
        <FormError message={error} />
        <Field label="Category">
          <Select value={cat} onChange={setCat} options={available.length ? available : categories} />
        </Field>
        <Field label="Monthly Limit (₹)">
          <Input value={allocated} onChange={setAlloc} placeholder="e.g. 4000" type="number" autoFocus />
        </Field>
        {initial?.cat && (
          <p className="text-xs text-muted-foreground">
            Spent so far this month: <span className="font-semibold text-foreground">₹{initial.spent.toLocaleString()}</span>
          </p>
        )}
        <p className="text-[11px] text-muted-foreground">Spending is calculated automatically from your expenses in this category.</p>
        <PrimaryBtn onClick={save} disabled={busy}>
          {busy ? "Saving…" : initial?.cat ? "Save Changes" : "Add Category"}
        </PrimaryBtn>
      </div>
    </Modal>
  );
}
