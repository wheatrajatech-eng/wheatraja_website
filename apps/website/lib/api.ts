const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8001/api/v1";

export async function apiGet<T>(path: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2200);
  const response = await fetch(`${API_BASE}${path}`, { credentials: "include", next: { revalidate: 60 }, signal: controller.signal }).finally(() => clearTimeout(timeout));
  if (!response.ok) throw new Error(`API request failed: ${response.status}`);
  return response.json();
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!response.ok) throw new Error(`API request failed: ${response.status}`);
  return response.json();
}
