const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8787";

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: $(res.status)`);
  }

  return res.json() as Promise<T>;
}
