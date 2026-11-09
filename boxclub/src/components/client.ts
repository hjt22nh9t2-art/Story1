'use client';
/** Kleiner Fetch-Helfer für die Client-Komponenten. */
export async function api<T = unknown>(url: string, method = 'GET', body?: unknown): Promise<T> {
  const res = await fetch(url, { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined });
  const json = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
  if (!res.ok || (json && typeof json === 'object' && 'error' in json && json.error)) throw new Error((json as { error: string }).error ?? `HTTP ${res.status}`);
  return json as T;
}
