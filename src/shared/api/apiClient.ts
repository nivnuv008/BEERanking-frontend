export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
export const BACKEND_BASE_URL: string = import.meta.env.VITE_BACKEND_URL || "";

export type BackendPagination = {
  page: number;
  limit: number;
  total: number;
  pages: number;
};

export type BackendPaginatedResponse<T> = {
  data: T[];
  pagination: BackendPagination;
};

export type PagingParams = {
  skip?: number;
  limit?: number;
};

export type PageResult<T> = {
  items: T[];
  total: number;
  nextSkip: number;
  hasMore: boolean;
};

export function toPageRequest(
  params: PagingParams = {},
  defaultLimit = 20,
): { skip: number; limit: number; page: number } {
  const skip = Math.max(0, params.skip ?? 0);
  const limit = Math.max(1, params.limit ?? defaultLimit);
  const page = Math.floor(skip / limit) + 1;

  return { skip, limit, page };
}

export function toPageResult<TInput, TOutput = TInput>(
  payload: BackendPaginatedResponse<TInput>,
  skip: number,
  mapItem?: (item: TInput) => TOutput,
): PageResult<TOutput> {
  const rawItems = Array.isArray(payload?.data) ? payload.data : [];
  const items = mapItem
    ? rawItems.map(mapItem)
    : (rawItems as unknown as TOutput[]);
  const total = payload?.pagination?.total ?? items.length;
  const nextSkip = skip + items.length;

  return {
    items,
    total,
    nextSkip,
    hasMore: nextSkip < total,
  };
}

export function resolveBackendAssetUrl(path?: string | null): string {
  if (!path) {
    return "";
  }

  if (/^https?:\/\//i.test(path) || path.startsWith("data:")) {
    return path;
  }

  if (!path.startsWith("/")) {
    return path;
  }

  if (BACKEND_BASE_URL) {
    return `${BACKEND_BASE_URL.replace(/\/$/, "")}${path}`;
  }

  if (
    API_BASE_URL.startsWith("http://") ||
    API_BASE_URL.startsWith("https://")
  ) {
    const apiUrl = new URL(API_BASE_URL);
    return `${apiUrl.origin}${path}`;
  }

  return path;
}

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
