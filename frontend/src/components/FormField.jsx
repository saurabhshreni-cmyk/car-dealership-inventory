import { useId } from "react";

const INPUT =
  "w-full border-2 border-ink bg-cream px-3 py-2.5 text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal disabled:opacity-60";

/** Labelled text input with consistent styling. Extra props go to the <input>. */
export default function FormField({ label, hint, ...inputProps }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-bold uppercase tracking-widest">
        {label}
      </label>
      <input id={id} aria-describedby={hint ? `${id}-hint` : undefined} className={INPUT} {...inputProps} />
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-xs text-ink/60">
          {hint}
        </p>
      )}
    </div>
  );
}
