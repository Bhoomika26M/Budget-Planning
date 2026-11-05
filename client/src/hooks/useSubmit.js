import { useCallback, useState } from "react";

/**
 * Small helper for forms that call the API:
 *   const { busy, error, setError, run } = useSubmit();
 *   run(() => onSave(data)).then(onClose)
 * `run` resolves to true on success and false when the action threw.
 */
export default function useSubmit() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const run = useCallback(async (action) => {
    setBusy(true);
    setError("");
    try {
      await action();
      return true;
    } catch (err) {
      setError(err?.message || "Something went wrong.");
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  return { busy, error, setError, run };
}
