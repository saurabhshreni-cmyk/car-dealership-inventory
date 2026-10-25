const EMPTY_FILTERS = { make: "", model: "", category: "", min_price: "", max_price: "" };

const FIELD =
  "w-full border-2 border-ink bg-cream px-3 py-2 text-sm placeholder:text-ink/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal";

function TextField({ label, name, value, onChange, type = "text", ...rest }) {
  const id = `filter-${name}`;
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-bold uppercase tracking-widest">
        {label}
      </label>
      <input id={id} type={type} value={value} onChange={(e) => onChange(name, e.target.value)} className={FIELD} {...rest} />
    </div>
  );
}

const chip = (active) =>
  `border-2 border-ink px-3 py-1 text-xs font-bold uppercase tracking-widest transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal ${
    active ? "bg-ink text-paper" : "bg-cream hover:bg-brass/30"
  }`;

/** Search inputs, price range and category chips. Fully controlled. */
export default function FilterBar({ filters, categories, onChange }) {
  const update = (name, value) => onChange({ ...filters, [name]: value });
  const isActive = Object.values(filters).some(Boolean);

  return (
    <section aria-label="Search and filter vehicles" className="border-2 border-ink bg-paper p-4 shadow-hard">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <TextField label="Make" name="make" value={filters.make} onChange={update} placeholder="Toyota" />
        <TextField label="Model" name="model" value={filters.model} onChange={update} placeholder="Camry" />
        <TextField label="Min price" name="min_price" type="number" min="0" value={filters.min_price} onChange={update} placeholder="0" />
        <TextField label="Max price" name="max_price" type="number" min="0" value={filters.max_price} onChange={update} placeholder="60000" />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2" role="group" aria-label="Category">
        <button type="button" aria-pressed={filters.category === ""} onClick={() => update("category", "")} className={chip(filters.category === "")}>
          All
        </button>
        {categories.map((category) => {
          const active = filters.category === category;
          return (
            <button key={category} type="button" aria-pressed={active} onClick={() => update("category", active ? "" : category)} className={chip(active)}>
              {category}
            </button>
          );
        })}
        {isActive && (
          <button
            type="button"
            onClick={() => onChange(EMPTY_FILTERS)}
            className="ml-auto text-xs font-bold uppercase tracking-widest underline decoration-2 underline-offset-4 hover:text-signal"
          >
            Clear filters
          </button>
        )}
      </div>
    </section>
  );
}
