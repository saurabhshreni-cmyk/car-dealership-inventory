import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { formatDate, formatPrice } from "../lib/format";

const ghostButton =
  "border-2 border-ink px-4 py-2 text-xs font-bold uppercase tracking-widest transition hover:bg-ink hover:text-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal";

export default function PurchasesPage() {
  const { api } = useAuth();
  const [view, setView] = useState({ status: "loading", purchases: [], error: "" });

  const load = useCallback(async () => {
    setView((current) => ({ ...current, status: "loading" }));
    try {
      const purchases = await api.myPurchases();
      setView({ status: "ready", purchases, error: "" });
    } catch (err) {
      setView({ status: "error", purchases: [], error: err.message });
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  const { purchases } = view;
  const total = purchases.reduce((sum, p) => sum + Number(p.price), 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-5xl font-semibold leading-none sm:text-6xl">My purchases</h1>
        {view.status === "ready" && purchases.length > 0 && (
          <p className="mt-3 text-sm font-bold uppercase tracking-widest text-ink/60">
            {purchases.length} {purchases.length === 1 ? "purchase" : "purchases"} · {formatPrice(total)} total
          </p>
        )}
      </div>

      {view.status === "loading" && (
        <p role="status" className="text-sm font-bold uppercase tracking-widest">
          Loading your purchases…
        </p>
      )}

      {view.status === "error" && (
        <div className="border-2 border-dashed border-signal bg-signal/5 px-6 py-12 text-center">
          <p role="alert" className="font-medium text-signal">
            {view.error}
          </p>
          <button type="button" onClick={load} className={`${ghostButton} mt-4`}>
            Try again
          </button>
        </div>
      )}

      {view.status === "ready" && purchases.length === 0 && (
        <div className="border-2 border-dashed border-ink/50 px-6 py-14 text-center">
          <p className="font-display text-2xl font-semibold">You haven’t bought anything yet.</p>
          <Link to="/" className={`${ghostButton} mt-5 inline-block`}>
            Browse vehicles
          </Link>
        </div>
      )}

      {view.status === "ready" && purchases.length > 0 && (
        <ol className="border-2 border-ink bg-cream shadow-hard">
          {purchases.map((purchase) => (
            <li
              key={purchase.id}
              className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b-2 border-dashed border-ink/40 px-5 py-4 last:border-b-0"
            >
              <div>
                <p className="font-display text-2xl font-semibold">
                  {purchase.make} {purchase.model}
                </p>
                <p className="text-xs font-bold uppercase tracking-widest text-ink/60">
                  Receipt #{String(purchase.id).padStart(4, "0")} · <time dateTime={purchase.purchased_at}>{formatDate(purchase.purchased_at)}</time>
                </p>
              </div>
              <p className="font-display text-2xl tabular-nums">{formatPrice(purchase.price)}</p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
