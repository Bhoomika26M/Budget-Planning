import { useState } from "react";

import useSubmit from "../../hooks/useSubmit";
import PrimaryBtn from "../Buttons/PrimaryButton";
import Field from "../Forms/Field";
import FormError from "../Forms/FormError";
import Input from "../Forms/FormInput";
import Modal from "./Modal";

// ── Edit Profile Modal ─────────────────────────────────────────────
export default function EditProfileModal({ profile, onSave, onClose }) {
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [university, setUniversity] = useState(profile.university);
  const [major, setMajor] = useState(profile.major);
  const [income, setIncome] = useState(String(profile.monthly_income ?? 0));
  const { busy, error, setError, run } = useSubmit();

  async function save() {
    if (name.trim().length < 2) return setError("Name is required.");
    if (!/\S+@\S+\.\S+/.test(email.trim())) return setError("Enter a valid email address.");
    if (Number(income) < 0) return setError("Monthly income cannot be negative.");
    const ok = await run(() =>
      onSave({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        university: university.trim(),
        major: major.trim(),
        monthly_income: Number(income || 0),
      })
    );
    if (ok) onClose();
  }

  const clearError = (setter) => (v) => {
    setter(v);
    setError("");
  };

  return (
    <Modal title="Edit Profile" onClose={onClose}>
      <div className="space-y-4">
        <FormError message={error} />
        <Field label="Full Name">
          <Input value={name} onChange={clearError(setName)} placeholder="John Doe" />
        </Field>
        <Field label="Email Address">
          <Input value={email} onChange={clearError(setEmail)} placeholder="you@example.com" type="email" />
        </Field>
        <Field label="University">
          <Input value={university} onChange={setUniversity} placeholder="e.g. Delhi University" />
        </Field>
        <Field label="Major / Programme">
          <Input value={major} onChange={setMajor} placeholder="e.g. BTech Computer Science" />
        </Field>
        <Field label="Monthly Income (₹)">
          <Input value={income} onChange={clearError(setIncome)} placeholder="e.g. 13000" type="number" />
        </Field>
        <PrimaryBtn onClick={save} disabled={busy}>
          {busy ? "Saving…" : "Save Changes"}
        </PrimaryBtn>
      </div>
    </Modal>
  );
}
