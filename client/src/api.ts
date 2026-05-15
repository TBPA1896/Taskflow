async function parseJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(path, {
    ...options,
    credentials: "include",
    headers,
  });

  if (res.status === 204) {
    return undefined as T;
  }

  const data = await parseJson<unknown>(res);

  if (!res.ok) {
    let message = res.statusText;
    if (data && typeof data === "object" && "error" in data) {
      const err = (data as { error: unknown }).error;
      message =
        typeof err === "string"
          ? err
          : err != null
            ? JSON.stringify(err)
            : message;
    }
    throw new Error(message || `Request failed (${res.status})`);
  }

  return data as T;
}
