import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ConfirmDialog from "./ConfirmDialog";
import RestockDialog from "./RestockDialog";
import VehicleFormDialog from "./VehicleFormDialog";

const camry = { id: 1, make: "Toyota", model: "Camry", category: "Sedan", price: 25000, quantity: 3 };

describe("VehicleFormDialog", () => {
  const fillAll = async () => {
    await userEvent.type(screen.getByLabelText("Make"), "Honda");
    await userEvent.type(screen.getByLabelText("Model"), "Civic");
    await userEvent.type(screen.getByLabelText("Category"), "Sedan");
    await userEvent.type(screen.getByLabelText(/price/i), "22000.5");
    await userEvent.type(screen.getByLabelText("Quantity"), "4");
  };

  it("submits a numeric payload when adding", async () => {
    const onSubmit = vi.fn().mockResolvedValue();
    render(<VehicleFormDialog onSubmit={onSubmit} onClose={() => {}} />);

    expect(screen.getByRole("dialog", { name: /add vehicle/i })).toBeInTheDocument();
    await fillAll();
    await userEvent.click(screen.getByRole("button", { name: /add vehicle/i }));

    expect(onSubmit).toHaveBeenCalledWith({ make: "Honda", model: "Civic", category: "Sedan", price: 22000.5, quantity: 4 });
  });

  it("prefills fields when editing", () => {
    render(<VehicleFormDialog vehicle={camry} onSubmit={vi.fn()} onClose={() => {}} />);

    expect(screen.getByRole("dialog", { name: /edit toyota camry/i })).toBeInTheDocument();
    expect(screen.getByLabelText("Make")).toHaveValue("Toyota");
    expect(screen.getByLabelText(/price/i)).toHaveValue(25000);
    expect(screen.getByRole("button", { name: /save changes/i })).toBeInTheDocument();
  });

  it("blocks submission and explains invalid input", async () => {
    const onSubmit = vi.fn();
    render(<VehicleFormDialog onSubmit={onSubmit} onClose={() => {}} />);
    await fillAll();
    await userEvent.clear(screen.getByLabelText(/price/i));
    await userEvent.type(screen.getByLabelText(/price/i), "0");

    await userEvent.click(screen.getByRole("button", { name: /add vehicle/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(/price must be greater than 0/i);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("requires the text fields", async () => {
    const onSubmit = vi.fn();
    render(<VehicleFormDialog onSubmit={onSubmit} onClose={() => {}} />);
    await userEvent.type(screen.getByLabelText(/price/i), "10");
    await userEvent.type(screen.getByLabelText("Quantity"), "1");

    await userEvent.click(screen.getByRole("button", { name: /add vehicle/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(/make is required/i);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows server errors and stays open", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error("price: Input should be greater than 0"));
    const onClose = vi.fn();
    render(<VehicleFormDialog onSubmit={onSubmit} onClose={onClose} />);
    await fillAll();

    await userEvent.click(screen.getByRole("button", { name: /add vehicle/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Input should be greater than 0");
    expect(onClose).not.toHaveBeenCalled();
  });

  it("closes on cancel and on Escape", async () => {
    const onClose = vi.fn();
    render(<VehicleFormDialog onSubmit={vi.fn()} onClose={onClose} />);

    await userEvent.click(screen.getByRole("button", { name: /cancel/i }));
    await userEvent.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("moves focus into the dialog", () => {
    render(<VehicleFormDialog onSubmit={vi.fn()} onClose={() => {}} />);

    expect(screen.getByLabelText("Make")).toHaveFocus();
  });
});

describe("RestockDialog", () => {
  it("submits the amount as a number", async () => {
    const onSubmit = vi.fn().mockResolvedValue();
    render(<RestockDialog vehicle={camry} onSubmit={onSubmit} onClose={() => {}} />);

    await userEvent.clear(screen.getByLabelText(/units to add/i));
    await userEvent.type(screen.getByLabelText(/units to add/i), "5");
    await userEvent.click(screen.getByRole("button", { name: /add stock/i }));

    expect(onSubmit).toHaveBeenCalledWith(5);
    expect(screen.getByRole("dialog", { name: /restock toyota camry/i })).toBeInTheDocument();
  });

  it("rejects zero, negative and fractional amounts", async () => {
    const onSubmit = vi.fn();
    render(<RestockDialog vehicle={camry} onSubmit={onSubmit} onClose={() => {}} />);

    for (const bad of ["0", "-2", "1.5"]) {
      await userEvent.clear(screen.getByLabelText(/units to add/i));
      await userEvent.type(screen.getByLabelText(/units to add/i), bad);
      await userEvent.click(screen.getByRole("button", { name: /add stock/i }));
      expect(screen.getByRole("alert")).toHaveTextContent(/whole number greater than 0/i);
    }
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe("ConfirmDialog", () => {
  it("names the vehicle and confirms or cancels", async () => {
    const onConfirm = vi.fn().mockResolvedValue();
    const onClose = vi.fn();
    render(<ConfirmDialog vehicle={camry} onConfirm={onConfirm} onClose={onClose} />);

    expect(screen.getByRole("alertdialog", { name: /delete toyota camry/i })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onClose).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole("button", { name: /^delete$/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
