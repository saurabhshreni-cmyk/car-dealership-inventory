import { formatPrice, stockNumber } from "../lib/format";

const LOW_STOCK_THRESHOLD = 2;
const MAX_TICKS = 10;

function StockMeter({ quantity }) {
  const filled = Math.min(quantity, MAX_TICKS);
  const tone = quantity <= LOW_STOCK_THRESHOLD ? "bg-signal" : "bg-pine";
  return (
    <div aria-hidden="true" className="flex gap-1">
      {Array.from({ length: MAX_TICKS }, (_, i) => (
        <span key={i} className={`h-2.5 w-2.5 border border-ink ${i < filled ? tone : "bg-transparent"}`} />
      ))}
    </div>
  );
}

function stockLabel(quantity) {
  if (quantity === 0) return "Sold out";
  if (quantity <= LOW_STOCK_THRESHOLD) return `Only ${quantity} left`;
  return `${quantity} in stock`;
}

const adminButton =
  "border-2 border-ink px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition hover:bg-ink hover:text-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal";

/** One vehicle in the dashboard grid. */
export default function VehicleCard({ vehicle, isAdmin, busy = false, onPurchase, onEdit, onDelete, onRestock }) {
  const { make, model, category, price, quantity, id } = vehicle;
  const name = `${make} ${model}`;
  const soldOut = quantity === 0;
  const lowStock = quantity <= LOW_STOCK_THRESHOLD;

  return (
    <article className="group relative flex flex-col border-2 border-ink bg-cream shadow-hard transition duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard-lg">
      <header className="flex items-center justify-between border-b-2 border-ink px-4 py-2 text-xs font-bold uppercase tracking-widest">
        <span className="text-ink/60">{stockNumber(id)}</span>
        <span className="border border-ink bg-brass/30 px-2 py-0.5">{category}</span>
      </header>

      <div className="flex flex-1 flex-col gap-4 px-4 pb-4 pt-5">
        <h3 className="font-display leading-none">
          <span className="block text-sm font-semibold uppercase tracking-widest text-ink/60">{make}</span>{" "}
          <span className="mt-1 block text-3xl font-semibold">{model}</span>
        </h3>

        <p className="font-display text-4xl tabular-nums text-ink">{formatPrice(price)}</p>

        <div className="mt-auto flex flex-col gap-2">
          <StockMeter quantity={quantity} />
          <p className={`text-sm font-bold ${lowStock ? "text-signal" : "text-pine"}`}>{stockLabel(quantity)}</p>
        </div>

        <button
          type="button"
          disabled={soldOut || busy}
          aria-label={`Purchase ${name}`}
          onClick={() => onPurchase(vehicle)}
          className="border-2 border-ink bg-ink px-4 py-3 text-sm font-bold uppercase tracking-widest text-paper transition hover:bg-signal hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal disabled:cursor-not-allowed disabled:border-ink/30 disabled:bg-mist disabled:text-ink/40 disabled:hover:bg-mist disabled:hover:text-ink/40"
        >
          {busy ? "Working…" : soldOut ? "Unavailable" : "Purchase"}
        </button>

        {isAdmin && (
          <div className="flex flex-wrap gap-2 border-t-2 border-dashed border-ink/40 pt-3">
            <button type="button" aria-label={`Edit ${name}`} onClick={() => onEdit(vehicle)} className={adminButton}>
              Edit
            </button>
            <button type="button" aria-label={`Restock ${name}`} onClick={() => onRestock(vehicle)} className={adminButton}>
              Restock
            </button>
            <button
              type="button"
              aria-label={`Delete ${name}`}
              onClick={() => onDelete(vehicle)}
              className={`${adminButton} border-signal text-signal hover:bg-signal hover:text-paper`}
            >
              Delete
            </button>
          </div>
        )}
      </div>

      {soldOut && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-14 -rotate-12 border-4 border-signal px-3 py-1 font-display text-2xl font-bold uppercase text-signal after:content-['Sold_out']"
        />
      )}
    </article>
  );
}
