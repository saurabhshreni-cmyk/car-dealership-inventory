import { useState } from "react";
import FormField from "./FormField";
import Modal, { ErrorMessage, primaryButton, secondaryButton } from "./Modal";

/** Ask an admin how many units to add. `onSubmit` receives a positive integer. */
export default function RestockDialog({ vehicle, onSubmit, onClose }) {
  const [amount, setAmount] = useState("1");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const units = Number(amount);
    if (amount === "" || !Number.isInteger(units) || units <= 0) {
      setError("Enter a whole number greater than 0.");
      return;
    }
    setError("");
    setPending(true);
    try {
      await onSubmit(units);
    } catch (err) {
      setError(err.message);
      setPending(false);
    }
  }

  return (
    <Modal title={`Restock ${vehicle.make} ${vehicle.model}`} onClose={onClose}>
      <p className="mb-4 text-sm text-ink/70">Currently {vehicle.quantity} in stock.</p>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <FormField label="Units to add" type="number" min="1" step="1" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <ErrorMessage>{error}</ErrorMessage>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className={secondaryButton} disabled={pending}>
            Cancel
          </button>
          <button type="submit" className={primaryButton} disabled={pending}>
            {pending ? "Adding…" : "Add stock"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
