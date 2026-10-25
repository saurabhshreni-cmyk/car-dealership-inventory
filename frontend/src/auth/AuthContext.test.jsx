import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "./AuthContext";
import { SESSION_KEY, fakeApi } from "../test/renderWithProviders";

function Probe() {
  const { user, isAuthenticated, isAdmin, login, logout, register } = useAuth();
  return (
    <div>
      <p data-testid="state">{isAuthenticated ? `in:${user.email}:${isAdmin ? "admin" : "user"}` : "out"}</p>
      <button onClick={() => login("a@b.co", "password1").catch(() => {})}>login</button>
      <button onClick={() => register("n@b.co", "password1")}>register</button>
      <button onClick={logout}>logout</button>
    </div>
  );
}

const renderProbe = (api) =>
  render(
    <AuthProvider api={api}>
      <Probe />
    </AuthProvider>,
  );

beforeEach(() => localStorage.clear());

describe("AuthProvider", () => {
  it("starts logged out with empty storage", () => {
    renderProbe(fakeApi());
    expect(screen.getByTestId("state")).toHaveTextContent("out");
  });

  it("restores a saved session", () => {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ token: "t", user: { id: 1, email: "x@y.z", role: "admin" } }));
    renderProbe(fakeApi());
    expect(screen.getByTestId("state")).toHaveTextContent("in:x@y.z:admin");
  });

  it("ignores corrupt storage", () => {
    localStorage.setItem(SESSION_KEY, "{not json");
    renderProbe(fakeApi());
    expect(screen.getByTestId("state")).toHaveTextContent("out");
  });

  it("login stores token and user", async () => {
    const api = fakeApi({
      login: vi.fn().mockResolvedValue({ access_token: "jwt", user: { id: 2, email: "a@b.co", role: "user" } }),
    });
    renderProbe(api);

    await userEvent.click(screen.getByText("login"));

    await waitFor(() => expect(screen.getByTestId("state")).toHaveTextContent("in:a@b.co:user"));
    expect(JSON.parse(localStorage.getItem(SESSION_KEY)).token).toBe("jwt");
  });

  it("failed login keeps the user logged out", async () => {
    const api = fakeApi({ login: vi.fn().mockRejectedValue(new Error("nope")) });
    renderProbe(api);

    await userEvent.click(screen.getByText("login"));

    expect(screen.getByTestId("state")).toHaveTextContent("out");
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it("register creates the account then signs in", async () => {
    const api = fakeApi({
      register: vi.fn().mockResolvedValue({ id: 3 }),
      login: vi.fn().mockResolvedValue({ access_token: "jwt", user: { id: 3, email: "n@b.co", role: "user" } }),
    });
    renderProbe(api);

    await userEvent.click(screen.getByText("register"));

    await waitFor(() => expect(screen.getByTestId("state")).toHaveTextContent("in:n@b.co:user"));
    expect(api.register).toHaveBeenCalledWith("n@b.co", "password1");
  });

  it("logout clears state and storage", async () => {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ token: "t", user: { id: 1, email: "x@y.z", role: "user" } }));
    renderProbe(fakeApi());

    await act(async () => userEvent.click(screen.getByText("logout")));

    expect(screen.getByTestId("state")).toHaveTextContent("out");
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  });
});
