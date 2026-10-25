import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const ToastContext = createContext(null);
const TOAST_LIFETIME_MS = 4500;

function ToastItem({ toast, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), TOAST_LIFETIME_MS);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const isError = toast.type === "error";
  return (
    <div
      role={isError ? "alert" : "status"}
      className={`flex items-start gap-3 border-2 border-ink px-4 py-3 shadow-hard animate-rise ${
        isError ? "bg-signal text-paper" : "bg-pine text-paper"
      }`}
    >
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={() => onDismiss(toast.id)}
        className="-mr-1 px-1 text-lg leading-none opacity-80 hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-paper"
      >
        ×
      </button>
    </div>
  );
}

/** Provides toast.success / toast.error and renders the live region. */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => setToasts((all) => all.filter((t) => t.id !== id)), []);
  const push = useCallback(
    (type, message) => setToasts((all) => [...all, { id: crypto.randomUUID(), type, message }]),
    [],
  );
  const api = useMemo(
    () => ({ success: (message) => push("success", message), error: (message) => push("error", message) }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-end gap-2 sm:left-auto sm:w-96">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto w-full">
            <ToastItem toast={toast} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside <ToastProvider>");
  return context;
}
