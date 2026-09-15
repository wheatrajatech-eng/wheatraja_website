export type ApiClientOptions = {
  baseUrl?: string;
  credentials?: RequestCredentials;
};

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(status: number, payload: unknown) {
    super(`API request failed: ${status}`);
    this.status = status;
    this.payload = payload;
  }
}

export function createApiClient(options: ApiClientOptions = {}) {
  const baseUrl = options.baseUrl ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8001/api/v1";
  const credentials = options.credentials ?? "include";

  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const csrf = typeof document === "undefined" ? "" : document.cookie.split("; ").find((row) => row.startsWith("wr_csrf="))?.split("=")[1] ?? "";
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      credentials,
      headers: {
        "Content-Type": "application/json",
        ...(csrf && init.method && init.method !== "GET" ? { "X-CSRF-Token": decodeURIComponent(csrf) } : {}),
        ...(init.headers ?? {})
      }
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new ApiError(response.status, payload);
    return payload as T;
  }

  return {
    get: <T>(path: string, init?: RequestInit) => request<T>(path, { ...init, method: "GET" }),
    post: <T>(path: string, body?: unknown, init?: RequestInit) => request<T>(path, { ...init, method: "POST", body: body === undefined ? undefined : JSON.stringify(body) }),
    patch: <T>(path: string, body?: unknown, init?: RequestInit) => request<T>(path, { ...init, method: "PATCH", body: body === undefined ? undefined : JSON.stringify(body) }),
    delete: <T>(path: string, init?: RequestInit) => request<T>(path, { ...init, method: "DELETE" })
  };
}
