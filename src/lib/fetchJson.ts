// Tiny Fetch Helper 
// Used in hooks to avoid repeating code 
export async function fetchJson<T>(
  url: string,
  opts: {
    signal?: AbortSignal;
    cache?: RequestCache;
    headers?: HeadersInit;
    credentials?: RequestCredentials;
  } = {}

): Promise<T> {
  // Perform the GET request and always request JSON
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

  // if response fails build readable err msg, with status code
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const msg = `HTTP ${res.status}${res.statusText ? `: ${res.statusText}` : ""}${
      text ? ` — ${text}` : ""
    }`;
    throw new Error(msg);
  }

  // parse and return JSON payload
  return (await res.json()) as T;
}
