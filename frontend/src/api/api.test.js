import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, createApi } from "./api";

const jsonResponse = (body, status = 200) =>
  Promise.resolve(new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } }));

let fetchMock;
beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

const makeApi = (token = "tok", onUnauthorized = vi.fn()) =>
  createApi({ baseUrl: "http://api.test", getToken: () => token, onUnauthorized });

describe("api client", () => {
  it("logs in with JSON and no Authorization header", async () => {
    fetchMock.mockReturnValue(jsonResponse({ access_token: "a", user: { id: 1 } }));

    const result = await makeApi(null).login("a@b.co", "password1");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://api.test/api/auth/login");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ email: "a@b.co", password: "password1" });
    expect(init.headers.Authorization).toBeUndefined();
    expect(result.access_token).toBe("a");
  });

  it("sends the bearer token on protected calls", async () => {
    fetchMock.mockReturnValue(jsonResponse([]));

    await makeApi("secret").listVehicles();

    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe("Bearer secret");
  });

  it("builds a search query string and skips empty filters", async () => {
    fetchMock.mockReturnValue(jsonResponse([]));

    await makeApi().searchVehicles({ make: "toy", model: "", category: "SUV", min_price: 100, max_price: "" });

    expect(fetchMock.mock.calls[0][0]).toBe("http://api.test/api/vehicles/search?make=toy&category=SUV&min_price=100");
  });

  it("posts purchase and restock to the right endpoints", async () => {
    fetchMock.mockImplementation(() => jsonResponse({}));
    const api = makeApi();

    await api.purchaseVehicle(3);
    await api.restockVehicle(3, 5);

    expect(fetchMock.mock.calls[0][0]).toBe("http://api.test/api/vehicles/3/purchase");
    expect(fetchMock.mock.calls[1][0]).toBe("http://api.test/api/vehicles/3/restock");
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ amount: 5 });
  });

  it("returns null for 204 responses", async () => {
    fetchMock.mockReturnValue(Promise.resolve(new Response(null, { status: 204 })));

    expect(await makeApi().deleteVehicle(9)).toBeNull();
  });

  it("throws ApiError carrying status and the server detail", async () => {
    fetchMock.mockReturnValue(jsonResponse({ detail: "Vehicle is out of stock" }, 409));

    await expect(makeApi().purchaseVehicle(1)).rejects.toMatchObject({
      name: "ApiError",
      status: 409,
      message: "Vehicle is out of stock",
    });
  });

  it("flattens FastAPI validation errors into a readable message", async () => {
    fetchMock.mockReturnValue(jsonResponse({ detail: [{ loc: ["body", "price"], msg: "Input should be greater than 0" }] }, 422));

    await expect(makeApi().createVehicle({})).rejects.toThrow("price: Input should be greater than 0");
  });

  it("reports network failures as ApiError with status 0", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    const error = await makeApi().listVehicles().catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(0);
  });

  it("calls onUnauthorized when an authenticated request gets 401", async () => {
    const onUnauthorized = vi.fn();
    fetchMock.mockReturnValue(jsonResponse({ detail: "Invalid or expired token" }, 401));

    await makeApi("old", onUnauthorized).listVehicles().catch(() => {});

    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });
});
