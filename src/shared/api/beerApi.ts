import { API_BASE_URL, parseJsonResponse } from "./apiClient";
import type { BackendPagination } from "./apiClient";

export type Beer = {
  _id: string;
  name: string;
  brewery: string;
  style: string;
  abv: number;
  description?: string;
};

type BeerSearchApiItem = {
  beerId?: string;
  _id?: string;
  name: string;
  brewery: string;
  style: string;
  abv: number;
  description?: string;
};

export type BeerPageResult = {
  items: Beer[];
  page: number;
  hasMore: boolean;
};

export async function getBeersPage(
  page = 1,
  limit = 20,
): Promise<BeerPageResult> {
  const response = await fetch(
    `${API_BASE_URL}/beers?page=${page}&limit=${limit}`,
  );
  const raw = await parseJsonResponse<unknown>(
    response,
    "Failed to load beers",
  );

  if (Array.isArray(raw)) {
    const items = raw as Beer[];
    return {
      items,
      page,
      hasMore: items.length >= limit,
    };
  }

  const data = (raw as { data?: Beer[] }).data;
  const pagination = (raw as { pagination?: BackendPagination }).pagination;
  const items = Array.isArray(data) ? data : [];
  const hasMore = pagination
    ? pagination.page < pagination.pages
    : items.length >= limit;

  return {
    items,
    page: pagination?.page ?? page,
    hasMore,
  };
}

export async function searchBeersPage(
  query: string,
  page = 1,
  limit = 20,
): Promise<BeerPageResult> {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return {
      items: [],
      page,
      hasMore: false,
    };
  }

  const response = await fetch(
    `${API_BASE_URL}/beers/search?q=${encodeURIComponent(normalizedQuery)}&page=${page}&limit=${limit}`,
  );
  const raw = await parseJsonResponse<unknown>(response, "Beer search failed");

  const items: BeerSearchApiItem[] = Array.isArray(raw)
    ? (raw as BeerSearchApiItem[])
    : ((raw as { data?: BeerSearchApiItem[] }).data ?? []);

  const mappedItems = items.map((item) => ({
    _id: item.beerId ?? item._id ?? "",
    name: item.name,
    brewery: item.brewery,
    style: item.style,
    abv: item.abv,
    description: item.description,
  }));

  const pagination = Array.isArray(raw)
    ? undefined
    : (raw as { pagination?: BackendPagination }).pagination;
  const hasMore = pagination
    ? pagination.page < pagination.pages
    : mappedItems.length >= limit;

  return {
    items: mappedItems,
    page: pagination?.page ?? page,
    hasMore,
  };
}
