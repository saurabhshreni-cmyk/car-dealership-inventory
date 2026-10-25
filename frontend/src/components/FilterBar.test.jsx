import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import FilterBar from "./FilterBar";

const empty = { make: "", model: "", category: "", min_price: "", max_price: "" };

const setup = (filters = empty) => {
  const onChange = vi.fn();
  render(<FilterBar filters={filters} categories={["Sedan", "SUV", "Truck"]} onChange={onChange} />);
  return onChange;
};

describe("FilterBar", () => {
  it("reports text and price changes", async () => {
    const onChange = setup();

    await userEvent.type(screen.getByLabelText("Make"), "t");
    await userEvent.type(screen.getByLabelText("Model"), "c");
    await userEvent.type(screen.getByLabelText("Min price"), "5");
    await userEvent.type(screen.getByLabelText("Max price"), "9");

    expect(onChange).toHaveBeenNthCalledWith(1, { ...empty, make: "t" });
    expect(onChange).toHaveBeenNthCalledWith(2, { ...empty, model: "c" });
    expect(onChange).toHaveBeenNthCalledWith(3, { ...empty, min_price: "5" });
    expect(onChange).toHaveBeenNthCalledWith(4, { ...empty, max_price: "9" });
  });

  it("renders category chips with pressed state", () => {
    setup({ ...empty, category: "SUV" });

    expect(screen.getByRole("button", { name: "SUV" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Sedan" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "All" })).toHaveAttribute("aria-pressed", "false");
  });

  it("selects a category, and toggles it off when clicked again", async () => {
    const onChange = setup({ ...empty, category: "SUV" });

    await userEvent.click(screen.getByRole("button", { name: "Truck" }));
    await userEvent.click(screen.getByRole("button", { name: "SUV" }));

    expect(onChange).toHaveBeenNthCalledWith(1, { ...empty, category: "Truck" });
    expect(onChange).toHaveBeenNthCalledWith(2, { ...empty, category: "" });
  });

  it("offers a clear button only when a filter is active", async () => {
    const { rerender } = render(<FilterBar filters={empty} categories={[]} onChange={() => {}} />);
    expect(screen.queryByRole("button", { name: /clear filters/i })).not.toBeInTheDocument();

    const onChange = vi.fn();
    rerender(<FilterBar filters={{ ...empty, make: "ford" }} categories={[]} onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: /clear filters/i }));

    expect(onChange).toHaveBeenCalledWith(empty);
  });
});
