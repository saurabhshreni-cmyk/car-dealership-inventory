import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import VehicleCard from "./VehicleCard";

const camry = { id: 7, make: "Toyota", model: "Camry", category: "Sedan", price: 25000.5, quantity: 3 };

const setup = (props = {}) => {
  const handlers = { onPurchase: vi.fn(), onEdit: vi.fn(), onDelete: vi.fn(), onRestock: vi.fn() };
  render(<VehicleCard vehicle={camry} isAdmin={false} {...handlers} {...props} />);
  return handlers;
};

describe("VehicleCard", () => {
  it("shows make, model, category, formatted price and stock", () => {
    setup();

    expect(screen.getByRole("heading", { name: /toyota camry/i })).toBeInTheDocument();
    expect(screen.getByText("Sedan")).toBeInTheDocument();
    expect(screen.getByText("$25,000.50")).toBeInTheDocument();
    expect(screen.getByText(/3 in stock/i)).toBeInTheDocument();
  });

  it("calls onPurchase with the vehicle", async () => {
    const { onPurchase } = setup();

    await userEvent.click(screen.getByRole("button", { name: /purchase toyota camry/i }));

    expect(onPurchase).toHaveBeenCalledWith(camry);
  });

  it("disables purchase and says sold out when quantity is 0", () => {
    setup({ vehicle: { ...camry, quantity: 0 } });

    expect(screen.getByRole("button", { name: /purchase toyota camry/i })).toBeDisabled();
    expect(screen.getByText(/sold out/i)).toBeInTheDocument();
  });

  it("disables purchase while busy", () => {
    setup({ busy: true });

    expect(screen.getByRole("button", { name: /purchase toyota camry/i })).toBeDisabled();
  });

  it("warns when stock is low", () => {
    setup({ vehicle: { ...camry, quantity: 2 } });

    expect(screen.getByText(/only 2 left/i)).toBeInTheDocument();
  });

  it("hides admin controls from normal users", () => {
    setup();

    expect(screen.queryByRole("button", { name: /edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /delete/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /restock/i })).not.toBeInTheDocument();
  });

  it("gives admins edit, restock and delete wired to handlers", async () => {
    const { onEdit, onRestock, onDelete } = setup({ isAdmin: true });

    await userEvent.click(screen.getByRole("button", { name: /edit toyota camry/i }));
    await userEvent.click(screen.getByRole("button", { name: /restock toyota camry/i }));
    await userEvent.click(screen.getByRole("button", { name: /delete toyota camry/i }));

    expect(onEdit).toHaveBeenCalledWith(camry);
    expect(onRestock).toHaveBeenCalledWith(camry);
    expect(onDelete).toHaveBeenCalledWith(camry);
  });
});
