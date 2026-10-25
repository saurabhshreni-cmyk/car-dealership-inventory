/** Split-screen frame shared by the login and registration pages. */
export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <aside className="relative hidden overflow-hidden border-r-2 border-ink bg-ink p-12 text-paper lg:flex lg:flex-col lg:justify-between">
        <p className="font-display text-2xl font-semibold tracking-tight">
          Lot<span className="text-signal">line</span>
        </p>
        <div>
          <p className="font-display text-6xl font-semibold leading-[0.95]">
            Every car on the lot,
            <br />
            <em className="text-brass">accounted for.</em>
          </p>
          <p className="mt-6 max-w-sm text-sm text-paper/70">
            Live stock counts, atomic purchases and a clean ledger of who bought what.
          </p>
        </div>
        <div aria-hidden="true" className="absolute -bottom-10 -right-10 h-64 w-64 rotate-12 border-[28px] border-dashed border-signal/70" />
        <p className="text-xs uppercase tracking-widest text-paper/50">Inventory system · demo build</p>
      </aside>

      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <p className="mb-8 font-display text-2xl font-semibold tracking-tight lg:hidden">
            Lot<span className="text-signal">line</span>
          </p>
          <h1 className="font-display text-4xl font-semibold leading-tight">{title}</h1>
          <p className="mb-8 mt-2 text-ink/70">{subtitle}</p>
          {children}
          <p className="mt-8 text-sm">{footer}</p>
        </div>
      </section>
    </main>
  );
}
