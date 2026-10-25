import { useState } from "react";
import FormField from "./FormField";
import Modal, { ErrorMessage, primaryButton, secondaryButton } from "./Modal";

/** Returns an error message for the draft, or "" when it is valid. */
function validate(draft) {
  if (!draft.make.trim()) return "Make is required.";
  if (!draft.model.trim()) return "Model is required.";
  if (!draft.category.trim()) return "Category is required.";
  const price = Number(draft.price);
  if (draft.price === "" || !(price > 0)) return "Price must be greater than 0.";
  const quantity = Number(draft.quantity);
  if (draft.quantity === "" || !Number.isInteger(quantity) || quantity < 0) {
    return "Quantity must be a whole number, 0 or more.";
  }
  return "";
}

const toDraft = (vehicle) => ({
  make: vehicle?.make ?? "",
  model: vehicle?.model ?? "",
  category: vehicle?.category ?? "",
  price: vehicle?.price ?? "",
  quantity: vehicle?.quantity ?? "",
});

/** Add (no `vehicle`) or edit (with `vehicle`) form. `onSubmit` receives a numeric payload. */
export default function VehicleFormDialog({ vehicle, onSubmit, onClose }) {
  const isEdit = Boolean(vehicle);
  const [draft, setDraft] = useState(() => toDraft(vehicle));
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const bind = (name) => ({
    value: draft[name],
    onChange: (e) => setDraft((current) => ({ ...current, [name]: e.target.value })),
  });

  async function handleSubmit(event) {
    event.preventDefault();
    const problem = validate(draft);
    if (problem) {
      setError(problem);
      return;
    }
    setError("");
    setPending(true);
    try {
      await onSubmit({
        make: draft.make.trim(),
        model: draft.model.trim(),
        category: draft.category.trim(),
        price: Number(draft.price),
        quantity: Number(draft.quantity),
      });
    } catch (err) {
      setError(err.message);
      setPending(false);
    }
  }

  return (
    <Modal title={isEdit ? `Edit ${vehicle.make} ${vehicle.model}` : "Add vehicle"} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Make" autoComplete="off" {...bind("make")} />
          <FormField label="Model" autoComplete="off" {...bind("model")} />
        </div>
        <FormField label="Category" autoComplete="off" hint="e.g. Sedan, SUV, Truck, Electric" {...bind("category")} />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Price (USD)" type="number" min="0" step="0.01" inputMode="decimal" {...bind("price")} />
          <FormField label="Quantity" type="number" min="0" step="1" inputMode="numeric" {...bind("quantity")} />
        </div>
        <ErrorMessage>{error}</ErrorMessage>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className={secondaryButton} disabled={pending}>
            Cancel
          </button>
          <button type="submit" className={primaryButton} disabled={pending}>
            {pending ? "Saving…" : isEdit ? "Save changes" : "Add vehicle"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
