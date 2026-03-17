import { useCallback, useEffect, useRef, useState } from "react";
import type { UIEvent } from "react";
import { getBeersPage, searchBeersPage } from "../api/beerApi";
import type { Beer } from "../types/beerType";

type UseBeerPickerDataOptions = {
  enabled?: boolean;
  debounceMs?: number;
  minQueryLength?: number;
  pageSize?: number;
  preloadCatalog?: boolean;
  onError?: (message: string) => void;
};

type UseBeerPickerDataResult = {
  query: string;
  setQuery: (value: string) => void;
  searchResults: Beer[];
  displayedBeers: Beer[];
  isSearching: boolean;
  isLoadingMore: boolean;
  hasActiveQuery: boolean;
  ensureCatalogLoaded: () => void;
  onScroll: (event: UIEvent<HTMLDivElement>) => void;
  reset: () => void;
  isInputFocused: boolean;
  onFocus: () => void;
  onBlur: () => void;
};

function mergeUniqueBeers(existing: Beer[], incoming: Beer[]): Beer[] {
  const byId = new Map(existing.map((beer) => [beer._id, beer]));

  incoming.forEach((beer) => {
    byId.set(beer._id, beer);
  });

  return Array.from(byId.values());
}

export function useBeerPickerData(
  options: UseBeerPickerDataOptions = {},
): UseBeerPickerDataResult {
  const {
    enabled = true,
    debounceMs = 300,
    minQueryLength = 2,
    pageSize = 20,
    preloadCatalog = false,
    onError,
  } = options;

  const searchTimeoutRef = useRef<number | null>(null);
  const beerBlurRef = useRef<number | null>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [query, setQuery] = useState("");
  const [catalogBeers, setCatalogBeers] = useState<Beer[]>([]);
  const [searchResults, setSearchResults] = useState<Beer[]>([]);
  const [catalogSkip, setCatalogSkip] = useState(0);
  const [catalogHasMore, setCatalogHasMore] = useState(true);
  const [isLoadingCatalogPage, setIsLoadingCatalogPage] = useState(false);
  const [searchSkip, setSearchSkip] = useState(0);
  const [searchHasMore, setSearchHasMore] = useState(false);
  const [isLoadingSearchPage, setIsLoadingSearchPage] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const hasActiveQuery = query.trim().length >= minQueryLength;

  const loadNextCatalogPage = useCallback(async () => {
    if (!enabled || isLoadingCatalogPage || !catalogHasMore) {
      return;
    }

    try {
      setIsLoadingCatalogPage(true);
      const result = await getBeersPage(
        { skip: catalogSkip, limit: pageSize },
        pageSize,
      );
      setCatalogBeers((current) => mergeUniqueBeers(current, result.items));
      setCatalogSkip(result.nextSkip);
      setCatalogHasMore(result.hasMore);
    } catch {
      setCatalogHasMore(false);
    } finally {
      setIsLoadingCatalogPage(false);
    }
  }, [
    enabled,
    isLoadingCatalogPage,
    catalogHasMore,
    catalogSkip,
    pageSize,
    onError,
  ]);

  const loadNextSearchPage = useCallback(async () => {
    const normalizedQuery = query.trim();

    if (
      !enabled ||
      normalizedQuery.length < minQueryLength ||
      isLoadingSearchPage ||
      !searchHasMore
    ) {
      return;
    }

    try {
      setIsLoadingSearchPage(true);
      const result = await searchBeersPage(
        normalizedQuery,
        { skip: searchSkip, limit: pageSize },
        pageSize,
      );
      setSearchResults((current) => mergeUniqueBeers(current, result.items));
      setSearchSkip(result.nextSkip);
      setSearchHasMore(result.hasMore);
    } catch (error) {
      setSearchHasMore(false);
      const message =
        error instanceof Error ? error.message : "Beer search failed";
      onError?.(message);
    } finally {
      setIsLoadingSearchPage(false);
    }
  }, [
    enabled,
    query,
    minQueryLength,
    isLoadingSearchPage,
    searchHasMore,
    searchSkip,
    pageSize,
    onError,
  ]);

  const ensureCatalogLoaded = useCallback(() => {
    if (!enabled || catalogBeers.length > 0 || catalogSkip > 0) {
      return;
    }

    void loadNextCatalogPage();
  }, [enabled, catalogBeers.length, catalogSkip, loadNextCatalogPage]);

  const reset = useCallback(() => {
    setQuery("");
    setSearchResults([]);
    setSearchSkip(0);
    setSearchHasMore(false);
    setIsSearching(false);
  }, []);

  const onScroll = useCallback(
    (event: UIEvent<HTMLDivElement>) => {
      if (!enabled) {
        return;
      }

      const element = event.currentTarget;
      const nearBottom =
        element.scrollTop + element.clientHeight >= element.scrollHeight - 24;

      if (!nearBottom) {
        return;
      }

      if (hasActiveQuery) {
        void loadNextSearchPage();
        return;
      }

      void loadNextCatalogPage();
    },
    [enabled, hasActiveQuery, loadNextSearchPage, loadNextCatalogPage],
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (preloadCatalog) {
      ensureCatalogLoaded();
    }
  }, [enabled, preloadCatalog, ensureCatalogLoaded]);

  const onFocus = useCallback(() => {
    if (beerBlurRef.current) {
      window.clearTimeout(beerBlurRef.current);
    }

    onError?.("");
    ensureCatalogLoaded();
    setIsInputFocused(true);
  }, [ensureCatalogLoaded, onError]);

  const onBlur = useCallback(() => {
    beerBlurRef.current = window.setTimeout(() => {
      setIsInputFocused(false);
    }, 150);
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const normalizedQuery = query.trim();

    if (normalizedQuery.length < minQueryLength) {
      setSearchResults([]);
      setSearchSkip(0);
      setSearchHasMore(false);
      setIsSearching(false);
      return;
    }

    if (searchTimeoutRef.current) {
      window.clearTimeout(searchTimeoutRef.current);
    }

    // Keep UI in searching state during debounce to avoid flashing "no results" too early.
    setIsSearching(true);

    searchTimeoutRef.current = window.setTimeout(async () => {
      try {
        const result = await searchBeersPage(
          normalizedQuery,
          { skip: 0, limit: pageSize },
          pageSize,
        );
        setSearchResults(result.items);
        setSearchSkip(result.nextSkip);
        setSearchHasMore(result.hasMore);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Beer search failed";
        onError?.(message);
      } finally {
        setIsSearching(false);
      }
    }, debounceMs);

    return () => {
      if (searchTimeoutRef.current) {
        window.clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [enabled, query, debounceMs, minQueryLength, pageSize, onError]);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        window.clearTimeout(searchTimeoutRef.current);
      }

      if (beerBlurRef.current) {
        window.clearTimeout(beerBlurRef.current);
      }
    };
  }, []);

  return {
    query,
    setQuery,
    searchResults,
    displayedBeers: hasActiveQuery ? searchResults : catalogBeers,
    isSearching,
    isLoadingMore: hasActiveQuery ? isLoadingSearchPage : isLoadingCatalogPage,
    hasActiveQuery,
    ensureCatalogLoaded,
    onScroll,
    reset,
    isInputFocused,
    onFocus,
    onBlur,
  };
}
