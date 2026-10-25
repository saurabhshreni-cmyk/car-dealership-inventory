import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeApi, renderWithProviders, seedSession } from "../test/renderWithProviders";
import DashboardPage from "./DashboardPage";

const camry = { id: 1, make: "Toyota", model: "Camry", category: "Sedan", price: 25000, quantity: 3 };

const renderAdmin = (overrides = {}) => {
  seedSession("admin");
  const api = fakeApi({ listVehicles: vi.fn().mockResolvedValue([camry]), ...overrides });
  renderWithProviders(<DashboardPage />, { api });
  return api;
};

beforeEach(() => localStorage.clear());

describe("DashboardPage as admin", () => {
  it("adds a vehicle and shows the new card", async () => {
    const created = { id: 2, make: "Honda", model: "Civic", category: "Sedan", price: 22000, quantity: 4 };
    const api = renderAdmin({ createVehicle: vi.fn().mockResolvedValue(created) });
    await screen.findByRole("heading", { name: /toyota camry/i });

    await userEvent.click(screen.getByRole("button", { name: /^add vehicle$/i }));
    const dialog = screen.getByRole("dialog", { name: /add vehicle/i });
    await userEvent.type(within(dialog).getByLabelText("Make"), "Honda");
    await userEvent.type(within(dialog).getByLabelText("Model"), "Civic");
    await userEvent.type(within(dialog).getByLabelText("Category"), "Sedan");
    await userEvent.type(within(dialog).getByLabelText(/price/i), "22000");
    await userEvent.type(within(dialog).getByLabelText("Quantity"), "4");
    await userEvent.click(within(dialog).getByRole("button", { name: /add vehicle/i }));

    expect(api.createVehicle).toHaveBeenCalledWith({ make: "Honda", model: "Civic", category: "Sedan", price: 22000, quantity: 4 });
    expect(await screen.findByRole("heading", { name: /honda civic/i })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("keeps the dialog open and shows the error when creation fails", async () => {
    renderAdmin({ createVehicle: vi.fn().mockRejectedValue(new Error("Admin privileges required")) });
    await screen.findByRole("heading", { name: /toyota camry/i });

    await userEvent.click(screen.getByRole("button", { name: /^add vehicle$/i }));
    const dialog = screen.getByRole("dialog");
    await userEvent.type(within(dialog).getByLabelText("Make"), "A");
    await userEvent.type(within(dialog).getByLabelText("Model"), "B");
    await userEvent.type(within(dialog).getByLabelText("Category"), "C");
    await userEvent.type(within(dialog).getByLabelText(/price/i), "1");
    await userEvent.type(within(dialog).getByLabelText("Quantity"), "1");
    await userEvent.click(within(dialog).getByRole("button", { name: /add vehicle/i }));

    expect(await within(dialog).findByRole("alert")).toHaveTextContent("Admin privileges required");
  });

  it("edits a vehicle in place", async () => {
    const updated = { ...camry, price: 26000 };
    const api = renderAdmin({ updateVehicle: vi.fn().mockResolvedValue(updated) });
    await screen.findByRole("heading", { name: /toyota camry/i });

    await userEvent.click(screen.getByRole("button", { name: /edit toyota camry/i }));
    const dialog = screen.getByRole("dialog", { name: /edit toyota camry/i });
    await userEvent.clear(within(dialog).getByLabelText(/price/i));
    await userEvent.type(within(dialog).getByLabelText(/price/i), "26000");
    await userEvent.click(within(dialog).getByRole("button", { name: /save changes/i }));

    expect(api.updateVehicle).toHaveBeenCalledWith(1, { make: "Toyota", model: "Camry", category: "Sedan", price: 26000, quantity: 3 });
    expect(await screen.findByText("$26,000.00")).toBeInTheDocument();
  });

  it("restocks a vehicle", async () => {
    const api = renderAdmin({ restockVehicle: vi.fn().mockResolvedValue({ ...camry, quantity: 8 }) });
    await screen.findByRole("heading", { name: /toyota camry/i });

    await userEvent.click(screen.getByRole("button", { name: /restock toyota camry/i }));
    const dialog = screen.getByRole("dialog", { name: /restock toyota camry/i });
    await userEvent.clear(within(dialog).getByLabelText(/units to add/i));
    await userEvent.type(within(dialog).getByLabelText(/units to add/i), "5");
    await userEvent.click(within(dialog).getByRole("button", { name: /add stock/i }));

    expect(api.restockVehicle).toHaveBeenCalledWith(1, 5);
    expect(await screen.findByText(/8 in stock/i)).toBeInTheDocument();
  });

  it("deletes a vehicle only after confirmation", async () => {
    const api = renderAdmin({ deleteVehicle: vi.fn().mockResolvedValue(null) });
    await screen.findByRole("heading", { name: /toyota camry/i });

    await userEvent.click(screen.getByRole("button", { name: /delete toyota camry/i }));
    await userEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: /cancel/i }));
    expect(api.deleteVehicle).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: /delete toyota camry/i }));
    await userEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: /^delete$/i }));

    expect(api.deleteVehicle).toHaveBeenCalledWith(1);
    await waitFor(() => expect(screen.queryByRole("heading", { name: /toyota camry/i })).not.toBeInTheDocument());
  });

  it("lets admins add the first vehicle from the empty state", async () => {
    renderAdmin({ listVehicles: vi.fn().mockResolvedValue([]) });

    expect(await screen.findByText(/no vehicles on the lot yet/i)).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /^add vehicle$/i }).length).toBeGreaterThan(0);
  });
});
