/** Thin fetch wrapper around the dealership REST API. */

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function describeDetail(detail, fallback) {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((d) => `${(d.loc ?? []).filter((p) => p !== "body").join(".")}: ${d.msg}`)
      .join("; ");
  }
  return fallback;
}

function toQuery(params) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined) search.append(key, value);
  });
  const text = search.toString();
  return text ? `?${text}` : "";
}

/**
 * Build an API object.
 * @param {{baseUrl: string, getToken: () => (string|null), onUnauthorized?: () => void}} options
 */
export function createApi({ baseUrl, getToken, onUnauthorized = () => {} }) {
  async function request(path, { method = "GET", body } = {}) {
    const token = getToken();
    const headers = {};
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (token) headers.Authorization = `Bearer ${token}`;

    let response;
    try {
      response = await fetch(`${baseUrl}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch {
      throw new ApiError("Cannot reach the server. Check your connection and try again.", 0);
    }

    if (response.status === 204) return null;
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      if (response.status === 401 && token) onUnauthorized();
      throw new ApiError(describeDetail(data?.detail, `Request failed (${response.status})`), response.status);
    }
    return data;
  }

  return {
    register: (email, password) => request("/api/auth/register", { method: "POST", body: { email, password } }),
    login: (email, password) => request("/api/auth/login", { method: "POST", body: { email, password } }),
    listVehicles: () => request("/api/vehicles"),
    searchVehicles: (filters) => request(`/api/vehicles/search${toQuery(filters)}`),
    createVehicle: (vehicle) => request("/api/vehicles", { method: "POST", body: vehicle }),
    updateVehicle: (id, vehicle) => request(`/api/vehicles/${id}`, { method: "PUT", body: vehicle }),
    deleteVehicle: (id) => request(`/api/vehicles/${id}`, { method: "DELETE" }),
    purchaseVehicle: (id) => request(`/api/vehicles/${id}/purchase`, { method: "POST" }),
    restockVehicle: (id, amount) => request(`/api/vehicles/${id}/restock`, { method: "POST", body: { amount } }),
    myPurchases: () => request("/api/purchases/me"),
  };
}
