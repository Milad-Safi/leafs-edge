/**
 * Small fetch helper used by hooks.
 *
 * Goals:
 * - Keep hook code readable (no repeated res.ok / res.json / res.text logic)
 * - Don't change runtime behavior: callers still decide how to handle AbortError
 */

export async function fetchJson<T>(
  url: string,
  opts: {
    signal?: AbortSignal;
    cache?: RequestCache;
    headers?: HeadersInit;
    credentials?: RequestCredentials;
  } = {}
): Promise<T> {
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      ...(opts.headers ?? {}),
    },
    signal: opts.signal,
    cache: opts.cache,
    credentials: opts.credentials ?? "omit",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const msg = `HTTP ${res.status}${res.statusText ? `: ${res.statusText}` : ""}${
      text ? ` — ${text}` : ""
    }`;
    throw new Error(msg);
  }

  return (await res.json()) as T;
}
