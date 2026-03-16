export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

type ErrorResponse = {
  error?: string;
  message?: string;
};

export async function parseJsonResponse<T>(
  response: Response,
  fallbackMessage = "Request failed",
): Promise<T> {
  let data: unknown = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const errorData = data as ErrorResponse | null;
    throw new Error(errorData?.error || errorData?.message || fallbackMessage);
  }

  return data as T;
}

export async function postJson<T>(
  path: string,
  body: Record<string, unknown>,
  fallbackMessage = "Request failed",
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  return parseJsonResponse<T>(response, fallbackMessage);
}
