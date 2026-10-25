import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../auth/AuthContext";
import { ToastProvider } from "../components/Toast";

export const fakeApi = (overrides = {}) => ({
  register: vi.fn(),
  login: vi.fn(),
  listVehicles: vi.fn().mockResolvedValue([]),
  searchVehicles: vi.fn().mockResolvedValue([]),
  createVehicle: vi.fn(),
  updateVehicle: vi.fn(),
  deleteVehicle: vi.fn(),
  purchaseVehicle: vi.fn(),
  restockVehicle: vi.fn(),
  myPurchases: vi.fn().mockResolvedValue([]),
  ...overrides,
});

export const SESSION_KEY = "dealership.session";

export function seedSession(role = "user") {
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ token: "tok", user: { id: 1, email: `${role}@example.com`, role } }),
  );
}

/** Render with router, toasts and an auth provider using a fake api. */
export function renderWithProviders(ui, { api = fakeApi(), route = "/" } = {}) {
  const result = render(
    <MemoryRouter initialEntries={[route]}>
      <ToastProvider>
        <AuthProvider api={api}>{ui}</AuthProvider>
      </ToastProvider>
    </MemoryRouter>,
  );
  return { api, ...result };
}
