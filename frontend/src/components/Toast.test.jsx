import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider, useToast } from "./Toast";

function Trigger() {
  const toast = useToast();
  return (
    <>
      <button onClick={() => toast.success("Saved it")}>ok</button>
      <button onClick={() => toast.error("Broke it")}>bad</button>
    </>
  );
}

const setup = () =>
  render(
    <ToastProvider>
      <Trigger />
    </ToastProvider>,
  );

describe("Toast", () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => vi.useRealTimers());

  it("announces success politely and errors assertively", async () => {
    setup();
    await userEvent.click(screen.getByText("ok"));
    await userEvent.click(screen.getByText("bad"));

    expect(screen.getByRole("status")).toHaveTextContent("Saved it");
    expect(screen.getByRole("alert")).toHaveTextContent("Broke it");
  });

  it("auto-dismisses after a few seconds", async () => {
    setup();
    await userEvent.click(screen.getByText("ok"));

    act(() => vi.advanceTimersByTime(5000));

    expect(screen.queryByText("Saved it")).not.toBeInTheDocument();
  });

  it("can be dismissed manually", async () => {
    setup();
    await userEvent.click(screen.getByText("ok"));

    await userEvent.click(screen.getByRole("button", { name: /dismiss/i }));

    expect(screen.queryByText("Saved it")).not.toBeInTheDocument();
  });
});
