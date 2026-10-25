import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it } from "vitest";
import { SESSION_KEY, renderWithProviders, seedSession } from "../test/renderWithProviders";
import AppShell from "./AppShell";

const renderShell = () =>
  renderWithProviders(
    <Routes>
      <Route path="/login" element={<p>login screen</p>} />
      <Route element={<AppShell />}>
        <Route path="/" element={<p>page body</p>} />
      </Route>
    </Routes>,
  );

beforeEach(() => localStorage.clear());

describe("AppShell", () => {
  it("shows navigation, the signed-in email and the page content", () => {
    seedSession("user");
    renderShell();

    expect(screen.getByRole("navigation", { name: /main/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /dashboard/i })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /my purchases/i })).toHaveAttribute("href", "/purchases");
    expect(screen.getByText("user@example.com")).toBeInTheDocument();
    expect(screen.getByText("page body")).toBeInTheDocument();
    expect(screen.queryByText(/^admin$/i)).not.toBeInTheDocument();
  });

  it("badges admins", () => {
    seedSession("admin");
    renderShell();

    expect(screen.getByText(/^admin$/i)).toBeInTheDocument();
  });

  it("signs out and returns to the login screen", async () => {
    seedSession("user");
    renderShell();

    await userEvent.click(screen.getByRole("button", { name: /sign out/i }));

    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
    expect(screen.getByText("login screen")).toBeInTheDocument();
  });

  it("offers a skip link for keyboard users", () => {
    seedSession("user");
    renderShell();

    expect(screen.getByRole("link", { name: /skip to content/i })).toHaveAttribute("href", "#main");
  });
});
