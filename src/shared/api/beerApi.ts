import {
  API_BASE_URL,
  parseJsonResponse,
  BackendPaginatedResponse,
  toPageRequest,
  toPageResult,
  PagingParams,
  PageResult,
} from "./apiClient";
import type { Beer } from "../types/beerType";

type BeerSearchApiItem = {
  beerId?: string;
  _id?: string;
  name: string;
  brewery: string;
  style: string;
  abv: number;
  description?: string;
};

export async function getBeersPage(
  params: PagingParams = {},
  defaultLimit = 20,
): Promise<PageResult<Beer>> {
  const { skip, limit, page } = toPageRequest(params, defaultLimit);

  const response = await fetch(
    `${API_BASE_URL}/beers?page=${page}&limit=${limit}`,
  );
  const payload = await parseJsonResponse<BackendPaginatedResponse<Beer>>(
    response,
    "Failed to load beers",
  );

  return toPageResult(payload, skip);
}

export async function searchBeersPage(
  query: string,
  params: PagingParams = {},
  defaultLimit = 20,
): Promise<PageResult<Beer>> {
  const normalizedQuery = query.trim();

  const { skip, limit, page } = toPageRequest(params, defaultLimit);

  if (!normalizedQuery) {
    return {
      items: [],
      total: 0,
      nextSkip: skip,
      hasMore: false,
    };
  }

  const response = await fetch(
    `${API_BASE_URL}/beers/search?q=${encodeURIComponent(normalizedQuery)}&page=${page}&limit=${limit}`,
  );
  const payload = await parseJsonResponse<
    BackendPaginatedResponse<BeerSearchApiItem>
  >(response, "Beer search failed");

  // Normalize search items to `Beer` shape
  const mappedPayload = {
    data: (payload?.data ?? []).map((item) => ({
      _id: item.beerId ?? item._id ?? "",
      name: item.name,
      brewery: item.brewery,
      style: item.style,
      abv: item.abv,
      description: item.description,
    })),
    pagination: payload.pagination,
  } as BackendPaginatedResponse<Beer>;

  return toPageResult(mappedPayload, skip);
}
