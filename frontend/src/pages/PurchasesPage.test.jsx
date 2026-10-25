import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fakeApi, renderWithProviders, seedSession } from "../test/renderWithProviders";
import PurchasesPage from "./PurchasesPage";

const purchases = [
  { id: 2, vehicle_id: 5, make: "Honda", model: "Civic", price: 22000, purchased_at: "2026-03-02T10:30:00Z" },
  { id: 1, vehicle_id: null, make: "Ford", model: "F-150", price: 45000.5, purchased_at: "2026-02-01T09:00:00Z" },
];

const renderPage = (api) => {
  seedSession("user");
  return renderWithProviders(
    <Routes>
      <Route path="/" element={<p>dashboard home</p>} />
      <Route path="/purchases" element={<PurchasesPage />} />
    </Routes>,
    { api, route: "/purchases" },
  );
};

beforeEach(() => localStorage.clear());

describe("PurchasesPage", () => {
  it("shows loading, then each purchase with price and date", async () => {
    renderPage(fakeApi({ myPurchases: vi.fn().mockResolvedValue(purchases) }));

    expect(screen.getByRole("status")).toHaveTextContent(/loading/i);
    expect(await screen.findByText("Honda Civic")).toBeInTheDocument();
    expect(screen.getByText("Ford F-150")).toBeInTheDocument();
    expect(screen.getByText("$22,000.00")).toBeInTheDocument();
    expect(screen.getByText("$45,000.50")).toBeInTheDocument();
  });

  it("summarises count and total spent", async () => {
    renderPage(fakeApi({ myPurchases: vi.fn().mockResolvedValue(purchases) }));

    expect(await screen.findByText(/2 purchases/i)).toBeInTheDocument();
    expect(screen.getByText(/\$67,000\.50/)).toBeInTheDocument();
  });

  it("shows an empty state that links back to the dashboard", async () => {
    renderPage(fakeApi({ myPurchases: vi.fn().mockResolvedValue([]) }));

    expect(await screen.findByText(/haven.t bought anything/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("link", { name: /browse vehicles/i }));
    expect(screen.getByText("dashboard home")).toBeInTheDocument();
  });

  it("shows an error and retries", async () => {
    const myPurchases = vi.fn().mockRejectedValueOnce(new Error("Cannot reach the server")).mockResolvedValue(purchases);
    renderPage(fakeApi({ myPurchases }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Cannot reach the server");
    await userEvent.click(screen.getByRole("button", { name: /try again/i }));

    expect(await screen.findByText("Honda Civic")).toBeInTheDocument();
  });
});
