import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ProtectedRoute from "../components/ProtectedRoute";
import { fakeApi, renderWithProviders, seedSession } from "../test/renderWithProviders";
import LoginPage from "./LoginPage";
import RegisterPage from "./RegisterPage";

const loggedIn = { access_token: "jwt", user: { id: 2, email: "a@b.co", role: "user" } };

const renderAuthRoutes = (api, route) =>
  renderWithProviders(
    <Routes>
      <Route path="/" element={<p>dashboard home</p>} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
    </Routes>,
    { api, route },
  );

beforeEach(() => localStorage.clear());

describe("LoginPage", () => {
  it("submits credentials and lands on the dashboard", async () => {
    const api = fakeApi({ login: vi.fn().mockResolvedValue(loggedIn) });
    renderAuthRoutes(api, "/login");

    await userEvent.type(screen.getByLabelText(/email/i), "a@b.co");
    await userEvent.type(screen.getByLabelText(/password/i), "password1");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByText("dashboard home")).toBeInTheDocument();
    expect(api.login).toHaveBeenCalledWith("a@b.co", "password1");
  });

  it("shows the server error and stays on the page", async () => {
    const api = fakeApi({ login: vi.fn().mockRejectedValue(new Error("Invalid email or password")) });
    renderAuthRoutes(api, "/login");

    await userEvent.type(screen.getByLabelText(/email/i), "a@b.co");
    await userEvent.type(screen.getByLabelText(/password/i), "wrongwrong");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid email or password");
    expect(screen.queryByText("dashboard home")).not.toBeInTheDocument();
  });

  it("disables the button while the request is in flight", async () => {
    let finish;
    const api = fakeApi({ login: vi.fn().mockReturnValue(new Promise((resolve) => (finish = resolve))) });
    renderAuthRoutes(api, "/login");
    await userEvent.type(screen.getByLabelText(/email/i), "a@b.co");
    await userEvent.type(screen.getByLabelText(/password/i), "password1");

    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(screen.getByRole("button", { name: /signing in/i })).toBeDisabled();
    finish(loggedIn);
    await screen.findByText("dashboard home");
  });

  it("links to registration", async () => {
    renderAuthRoutes(fakeApi(), "/login");

    await userEvent.click(screen.getByRole("link", { name: /create an account/i }));

    expect(screen.getByRole("heading", { name: /create your account/i })).toBeInTheDocument();
  });

  it("sends already signed-in users straight to the dashboard", () => {
    seedSession("user");
    renderAuthRoutes(fakeApi(), "/login");

    expect(screen.getByText("dashboard home")).toBeInTheDocument();
  });
});

describe("RegisterPage", () => {
  const fill = async (password, confirm) => {
    await userEvent.type(screen.getByLabelText(/^email/i), "n@b.co");
    await userEvent.type(screen.getByLabelText(/^password/i), password);
    await userEvent.type(screen.getByLabelText(/confirm password/i), confirm);
    await userEvent.click(screen.getByRole("button", { name: /create account/i }));
  };

  it("rejects mismatched passwords without calling the API", async () => {
    const api = fakeApi();
    renderAuthRoutes(api, "/register");

    await fill("password1", "password2");

    expect(screen.getByRole("alert")).toHaveTextContent(/passwords do not match/i);
    expect(api.register).not.toHaveBeenCalled();
  });

  it("registers, signs in and lands on the dashboard", async () => {
    const api = fakeApi({ register: vi.fn().mockResolvedValue({ id: 2 }), login: vi.fn().mockResolvedValue(loggedIn) });
    renderAuthRoutes(api, "/register");

    await fill("password1", "password1");

    expect(await screen.findByText("dashboard home")).toBeInTheDocument();
    expect(api.register).toHaveBeenCalledWith("n@b.co", "password1");
  });

  it("surfaces a duplicate-email error", async () => {
    const api = fakeApi({ register: vi.fn().mockRejectedValue(new Error("Email already registered")) });
    renderAuthRoutes(api, "/register");

    await fill("password1", "password1");

    expect(await screen.findByRole("alert")).toHaveTextContent("Email already registered");
  });
});

describe("ProtectedRoute", () => {
  const renderGuarded = () =>
    renderWithProviders(
      <Routes>
        <Route path="/login" element={<p>login screen</p>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<p>secret stuff</p>} />
        </Route>
      </Routes>,
    );

  it("redirects anonymous visitors to /login", async () => {
    renderGuarded();

    await waitFor(() => expect(screen.getByText("login screen")).toBeInTheDocument());
    expect(screen.queryByText("secret stuff")).not.toBeInTheDocument();
  });

  it("renders the page for signed-in users", () => {
    seedSession("user");
    renderGuarded();

    expect(screen.getByText("secret stuff")).toBeInTheDocument();
  });
});
