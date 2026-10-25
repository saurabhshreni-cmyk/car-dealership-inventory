import { useState } from "react";
import Modal, { ErrorMessage, secondaryButton } from "./Modal";

/** Destructive confirmation for deleting a vehicle. */
export default function ConfirmDialog({ vehicle, onConfirm, onClose }) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleConfirm() {
    setError("");
    setPending(true);
    try {
      await onConfirm();
    } catch (err) {
      setError(err.message);
      setPending(false);
    }
  }

  return (
    <Modal role="alertdialog" title={`Delete ${vehicle.make} ${vehicle.model}?`} onClose={onClose}>
      <p className="mb-6 text-sm text-ink/70">
        This removes the vehicle from the lot. Existing purchase receipts are kept.
      </p>
      <ErrorMessage>{error}</ErrorMessage>
      <div className="mt-4 flex justify-end gap-3">
        <button type="button" onClick={onClose} className={secondaryButton} disabled={pending}>
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={pending}
          className="border-2 border-signal bg-signal px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-paper transition hover:bg-ink hover:border-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-wait disabled:opacity-60"
        >
          {pending ? "Deleting…" : "Delete"}
        </button>
      </div>
    </Modal>
  );
}
