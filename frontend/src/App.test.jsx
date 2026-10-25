import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { fakeApi, renderWithProviders, seedSession } from "./test/renderWithProviders";

beforeEach(() => localStorage.clear());

describe("App routing", () => {
  it("sends anonymous visitors to the login page", () => {
    renderWithProviders(<App />, { route: "/" });

    expect(screen.getByRole("heading", { name: /welcome back/i })).toBeInTheDocument();
  });

  it("shows the dashboard to signed-in users", async () => {
    seedSession("user");
    renderWithProviders(<App />, { route: "/", api: fakeApi({ listVehicles: vi.fn().mockResolvedValue([]) }) });

    expect(await screen.findByRole("heading", { name: /on the lot/i })).toBeInTheDocument();
  });

  it("protects the purchases page", () => {
    renderWithProviders(<App />, { route: "/purchases" });

    expect(screen.getByRole("heading", { name: /welcome back/i })).toBeInTheDocument();
  });

  it("renders a friendly 404 for unknown routes", () => {
    seedSession("user");
    renderWithProviders(<App />, { route: "/nope" });

    expect(screen.getByRole("heading", { name: /page not found/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back to the lot/i })).toHaveAttribute("href", "/");
  });
});
