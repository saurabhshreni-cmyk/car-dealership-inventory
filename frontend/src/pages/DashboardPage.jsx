import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import ConfirmDialog from "../components/ConfirmDialog";
import FilterBar from "../components/FilterBar";
import RestockDialog from "../components/RestockDialog";
import { useToast } from "../components/Toast";
import VehicleCard from "../components/VehicleCard";
import VehicleFormDialog from "../components/VehicleFormDialog";
import { useDebouncedValue } from "../lib/useDebouncedValue";

const EMPTY_FILTERS = { make: "", model: "", category: "", min_price: "", max_price: "" };
const SEARCH_DEBOUNCE_MS = 350;
const SKELETON_COUNT = 6;

const hasActiveFilters = (filters) => Object.values(filters).some((value) => value !== "");

function LoadingGrid() {
  return (
    <div>
      <p role="status" className="mb-4 text-sm font-bold uppercase tracking-widest">
        Loading vehicles…
      </p>
      <div aria-hidden="true" className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: SKELETON_COUNT }, (_, i) => (
          <div key={i} className="h-72 animate-pulse border-2 border-ink/30 bg-mist/60" />
        ))}
      </div>
    </div>
  );
}

function Notice({ title, children, tone = "plain" }) {
  return (
    <div
      className={`border-2 border-dashed px-6 py-14 text-center ${tone === "error" ? "border-signal bg-signal/5" : "border-ink/50"}`}
    >
      <p className="font-display text-2xl font-semibold">{title}</p>
      <div className="mt-3 flex flex-col items-center gap-3 text-sm text-ink/70">{children}</div>
    </div>
  );
}

const addButton =
  "border-2 border-ink bg-signal px-5 py-3 text-xs font-bold uppercase tracking-widest text-ink shadow-hard transition hover:-translate-y-0.5 hover:bg-ink hover:text-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

const ghostButton =
  "border-2 border-ink px-4 py-2 text-xs font-bold uppercase tracking-widest transition hover:bg-ink hover:text-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal";

export default function DashboardPage() {
  const { api, isAdmin } = useAuth();
  const toast = useToast();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const debouncedFilters = useDebouncedValue(filters, SEARCH_DEBOUNCE_MS);
  const [view, setView] = useState({ status: "loading", vehicles: [], error: "" });
  const [refreshing, setRefreshing] = useState(false);
  const [categories, setCategories] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [dialog, setDialog] = useState(null);
  const latestRequest = useRef(0);

  const load = useCallback(
    async (activeFilters) => {
      const requestId = ++latestRequest.current;
      setRefreshing(true);
      try {
        const filtered = hasActiveFilters(activeFilters);
        const vehicles = filtered ? await api.searchVehicles(activeFilters) : await api.listVehicles();
        if (requestId !== latestRequest.current) return;
        if (!filtered) setCategories([...new Set(vehicles.map((v) => v.category))].sort());
        setView({ status: "ready", vehicles, error: "" });
      } catch (err) {
        if (requestId !== latestRequest.current) return;
        setView((current) => ({ ...current, status: "error", error: err.message }));
      } finally {
        if (requestId === latestRequest.current) setRefreshing(false);
      }
    },
    [api],
  );

  useEffect(() => {
    load(debouncedFilters);
  }, [debouncedFilters, load]);

  const retry = () => {
    setView((current) => ({ ...current, status: "loading" }));
    load(debouncedFilters);
  };

  async function handlePurchase(vehicle) {
    setBusyId(vehicle.id);
    try {
      await api.purchaseVehicle(vehicle.id);
      setView((current) => ({
        ...current,
        vehicles: current.vehicles.map((v) => (v.id === vehicle.id ? { ...v, quantity: v.quantity - 1 } : v)),
      }));
      toast.success(`Purchased ${vehicle.make} ${vehicle.model}`);
    } catch (err) {
      toast.error(err.message);
      load(debouncedFilters);
    } finally {
      setBusyId(null);
    }
  }

  const closeDialog = useCallback(() => setDialog(null), []);

  const replaceVehicle = (updated) =>
    setView((current) => ({ ...current, vehicles: current.vehicles.map((v) => (v.id === updated.id ? updated : v)) }));

  async function saveVehicle(payload) {
    if (dialog.vehicle) {
      replaceVehicle(await api.updateVehicle(dialog.vehicle.id, payload));
      toast.success(`Updated ${payload.make} ${payload.model}`);
    } else {
      const created = await api.createVehicle(payload);
      setView((current) => ({ ...current, vehicles: [...current.vehicles, created] }));
      setCategories((current) => [...new Set([...current, created.category])].sort());
      toast.success(`Added ${created.make} ${created.model}`);
    }
    closeDialog();
  }

  async function restock(amount) {
    const updated = await api.restockVehicle(dialog.vehicle.id, amount);
    replaceVehicle(updated);
    toast.success(`Added ${amount} to ${updated.make} ${updated.model}`);
    closeDialog();
  }

  async function removeVehicle() {
    const { vehicle } = dialog;
    await api.deleteVehicle(vehicle.id);
    setView((current) => ({ ...current, vehicles: current.vehicles.filter((v) => v.id !== vehicle.id) }));
    toast.success(`Deleted ${vehicle.make} ${vehicle.model}`);
    closeDialog();
  }

  const filtersActive = hasActiveFilters(filters);
  const count = view.vehicles.length;
  const heading = useMemo(() => (filtersActive ? "Matching vehicles" : "On the lot"), [filtersActive]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-5xl font-semibold leading-none sm:text-6xl">{heading}</h1>
          {view.status === "ready" && (
            <p className="mt-3 text-sm font-bold uppercase tracking-widest text-ink/60">
              {count} {count === 1 ? "vehicle" : "vehicles"}
            </p>
          )}
        </div>
        {isAdmin && (
          <button type="button" onClick={() => setDialog({ type: "form" })} className={addButton}>
            Add vehicle
          </button>
        )}
      </div>

      <FilterBar filters={filters} categories={categories} onChange={setFilters} />

      {view.status === "loading" && <LoadingGrid />}

      {view.status === "error" && (
        <Notice title="We couldn’t load the lot." tone="error">
          <p role="alert" className="font-medium text-signal">
            {view.error}
          </p>
          <button type="button" onClick={retry} className={ghostButton}>
            Try again
          </button>
        </Notice>
      )}

      {view.status === "ready" && count === 0 && (
        <Notice title={filtersActive ? "No vehicles match your filters." : "No vehicles on the lot yet."}>
          {filtersActive ? (
            <button type="button" onClick={() => setFilters(EMPTY_FILTERS)} className={ghostButton}>
              Clear filters
            </button>
          ) : isAdmin ? (
            <button type="button" onClick={() => setDialog({ type: "form" })} className={ghostButton}>
              Add vehicle
            </button>
          ) : (
            <p>Check back soon.</p>
          )}
        </Notice>
      )}

      {view.status === "ready" && count > 0 && (
        <ul
          aria-busy={refreshing}
          className={`grid gap-6 transition-opacity sm:grid-cols-2 xl:grid-cols-3 ${refreshing ? "opacity-60" : ""}`}
        >
          {view.vehicles.map((vehicle) => (
            <li key={vehicle.id} className="flex">
              <div className="flex w-full">
                <VehicleCard
                  vehicle={vehicle}
                  isAdmin={isAdmin}
                  busy={busyId === vehicle.id}
                  onPurchase={handlePurchase}
                  onEdit={(v) => setDialog({ type: "form", vehicle: v })}
                  onRestock={(v) => setDialog({ type: "restock", vehicle: v })}
                  onDelete={(v) => setDialog({ type: "delete", vehicle: v })}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      {dialog?.type === "form" && <VehicleFormDialog vehicle={dialog.vehicle} onSubmit={saveVehicle} onClose={closeDialog} />}
      {dialog?.type === "restock" && <RestockDialog vehicle={dialog.vehicle} onSubmit={restock} onClose={closeDialog} />}
      {dialog?.type === "delete" && <ConfirmDialog vehicle={dialog.vehicle} onConfirm={removeVehicle} onClose={closeDialog} />}
    </div>
  );
}
