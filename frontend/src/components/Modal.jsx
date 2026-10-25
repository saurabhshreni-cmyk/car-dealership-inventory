import { useEffect, useId, useRef } from "react";

/**
 * Accessible modal: labelled, closes on Escape / backdrop click, moves focus in
 * (to the first field, or the dialog itself) and restores focus on close.
 */
export default function Modal({ title, onClose, children, role = "dialog" }) {
  const titleId = useId();
  const panelRef = useRef(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const target = panelRef.current.querySelector("input, select, textarea") ?? panelRef.current;
    target.focus();

    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/60 p-0 sm:items-center sm:p-6" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={panelRef}
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="max-h-full w-full max-w-lg overflow-y-auto border-2 border-ink bg-paper p-6 shadow-hard-lg animate-rise focus:outline-none sm:p-8"
      >
        <h2 id={titleId} className="mb-6 font-display text-3xl font-semibold leading-tight">
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}

export const primaryButton =
  "border-2 border-ink bg-ink px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-paper transition hover:bg-signal hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal disabled:cursor-wait disabled:opacity-60";

export const secondaryButton =
  "border-2 border-ink px-5 py-2.5 text-xs font-bold uppercase tracking-widest transition hover:bg-ink hover:text-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal disabled:opacity-60";

export function ErrorMessage({ children }) {
  if (!children) return null;
  return (
    <p role="alert" className="border-2 border-signal bg-signal/10 px-3 py-2 text-sm font-medium text-signal">
      {children}
    </p>
  );
}
