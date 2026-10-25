import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeApi, renderWithProviders, seedSession } from "../test/renderWithProviders";
import DashboardPage from "./DashboardPage";

const camry = { id: 1, make: "Toyota", model: "Camry", category: "Sedan", price: 25000, quantity: 3 };
const rav4 = { id: 2, make: "Toyota", model: "RAV4", category: "SUV", price: 32000, quantity: 0 };
const fleet = [camry, rav4];

const renderDashboard = (apiOverrides = {}) => {
  seedSession("user");
  const api = fakeApi({ listVehicles: vi.fn().mockResolvedValue(fleet), ...apiOverrides });
  return renderWithProviders(<DashboardPage />, { api });
};

beforeEach(() => localStorage.clear());

describe("DashboardPage", () => {
  it("shows a loading state, then the vehicle cards", async () => {
    renderDashboard();

    expect(screen.getByRole("status")).toHaveTextContent(/loading/i);
    expect(await screen.findByRole("heading", { name: /toyota camry/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /toyota rav4/i })).toBeInTheDocument();
    expect(screen.queryByText(/loading vehicles/i)).not.toBeInTheDocument();
  });

  it("disables purchase for sold-out vehicles", async () => {
    renderDashboard();

    expect(await screen.findByRole("button", { name: /purchase toyota rav4/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /purchase toyota camry/i })).toBeEnabled();
  });

  it("shows an empty state when there are no vehicles", async () => {
    renderDashboard({ listVehicles: vi.fn().mockResolvedValue([]) });

    expect(await screen.findByText(/no vehicles/i)).toBeInTheDocument();
  });

  it("shows an error with a retry that recovers", async () => {
    const listVehicles = vi.fn().mockRejectedValueOnce(new Error("Cannot reach the server")).mockResolvedValue(fleet);
    renderDashboard({ listVehicles });

    expect(await screen.findByRole("alert")).toHaveTextContent("Cannot reach the server");
    await userEvent.click(screen.getByRole("button", { name: /try again/i }));

    expect(await screen.findByRole("heading", { name: /toyota camry/i })).toBeInTheDocument();
  });

  it("purchases a vehicle, toasts, and updates stock in place", async () => {
    const purchaseVehicle = vi.fn().mockResolvedValue({ id: 9, vehicle_id: 1 });
    renderDashboard({ purchaseVehicle });
    await screen.findByRole("heading", { name: /toyota camry/i });

    await userEvent.click(screen.getByRole("button", { name: /purchase toyota camry/i }));

    expect(purchaseVehicle).toHaveBeenCalledWith(1);
    expect(await screen.findByText(/only 2 left/i)).toBeInTheDocument();
    expect(screen.getAllByRole("status").some((el) => /purchased toyota camry/i.test(el.textContent))).toBe(true);
  });

  it("shows an error toast and re-syncs when the purchase fails", async () => {
    const purchaseVehicle = vi.fn().mockRejectedValue(new Error("Vehicle is out of stock"));
    const { api } = renderDashboard({ purchaseVehicle });
    await screen.findByRole("heading", { name: /toyota camry/i });

    await userEvent.click(screen.getByRole("button", { name: /purchase toyota camry/i }));

    expect(await screen.findByText("Vehicle is out of stock")).toBeInTheDocument();
    await waitFor(() => expect(api.listVehicles).toHaveBeenCalledTimes(2));
  });

  it("derives category chips from the inventory and filters by category", async () => {
    const searchVehicles = vi.fn().mockResolvedValue([rav4]);
    renderDashboard({ searchVehicles });
    await screen.findByRole("heading", { name: /toyota camry/i });

    const group = screen.getByRole("group", { name: /category/i });
    expect(within(group).getByRole("button", { name: "Sedan" })).toBeInTheDocument();
    await userEvent.click(within(group).getByRole("button", { name: "SUV" }));

    await waitFor(() =>
      expect(searchVehicles).toHaveBeenLastCalledWith({
        make: "",
        model: "",
        category: "SUV",
        min_price: "",
        max_price: "",
      }),
    );
    await waitFor(() => expect(screen.queryByRole("heading", { name: /toyota camry/i })).not.toBeInTheDocument());
    expect(screen.getByRole("heading", { name: /toyota rav4/i })).toBeInTheDocument();
  });

  it("debounces text search before calling the API", async () => {
    const searchVehicles = vi.fn().mockResolvedValue([camry]);
    renderDashboard({ searchVehicles });
    await screen.findByRole("heading", { name: /toyota camry/i });

    await userEvent.type(screen.getByLabelText("Make"), "toy");

    expect(searchVehicles).not.toHaveBeenCalled();
    await waitFor(() => expect(searchVehicles).toHaveBeenCalledTimes(1), { timeout: 2000 });
    expect(searchVehicles.mock.calls[0][0].make).toBe("toy");
  });

  it("explains when filters match nothing and offers to clear them", async () => {
    const searchVehicles = vi.fn().mockResolvedValue([]);
    renderDashboard({ searchVehicles });
    await screen.findByRole("heading", { name: /toyota camry/i });

    await userEvent.type(screen.getByLabelText("Make"), "zzz");

    expect(await screen.findByText(/no vehicles match/i, {}, { timeout: 2000 })).toBeInTheDocument();
  });

  it("does not offer admin controls to normal users", async () => {
    renderDashboard();
    await screen.findByRole("heading", { name: /toyota camry/i });

    expect(screen.queryByRole("button", { name: /add vehicle/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /edit toyota camry/i })).not.toBeInTheDocument();
  });
});
