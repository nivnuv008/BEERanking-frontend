import { useCallback, useEffect, useRef, useState } from 'react';
import type { UIEvent } from 'react';
import { getBeersPage, searchBeersPage, type Beer } from '../api/beerApi';

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
};

function mergeUniqueBeers(existing: Beer[], incoming: Beer[]): Beer[] {
  const byId = new Map(existing.map((beer) => [beer._id, beer]));

  incoming.forEach((beer) => {
    byId.set(beer._id, beer);
  });

  return Array.from(byId.values());
}

export function useBeerPickerData(options: UseBeerPickerDataOptions = {}): UseBeerPickerDataResult {
  const {
    enabled = true,
    debounceMs = 300,
    minQueryLength = 2,
    pageSize = 20,
    preloadCatalog = false,
    onError,
  } = options;

  const searchTimeoutRef = useRef<number | null>(null);
  const [query, setQuery] = useState('');
  const [catalogBeers, setCatalogBeers] = useState<Beer[]>([]);
  const [searchResults, setSearchResults] = useState<Beer[]>([]);
  const [catalogPage, setCatalogPage] = useState(0);
  const [catalogHasMore, setCatalogHasMore] = useState(true);
  const [isLoadingCatalogPage, setIsLoadingCatalogPage] = useState(false);
  const [searchPage, setSearchPage] = useState(0);
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
      const nextPage = catalogPage + 1;
      const result = await getBeersPage(nextPage, pageSize);
      setCatalogBeers((current) => mergeUniqueBeers(current, result.items));
      setCatalogPage(result.page);
      setCatalogHasMore(result.hasMore);
    } catch {
      setCatalogHasMore(false);
    } finally {
      setIsLoadingCatalogPage(false);
    }
  }, [enabled, isLoadingCatalogPage, catalogHasMore, catalogPage, pageSize, onError]);

  const loadNextSearchPage = useCallback(async () => {
    const normalizedQuery = query.trim();

    if (!enabled || normalizedQuery.length < minQueryLength || isLoadingSearchPage || !searchHasMore) {
      return;
    }

    try {
      setIsLoadingSearchPage(true);
      const nextPage = searchPage + 1;
      const result = await searchBeersPage(normalizedQuery, nextPage, pageSize);
      setSearchResults((current) => mergeUniqueBeers(current, result.items));
      setSearchPage(result.page);
      setSearchHasMore(result.hasMore);
    } catch (error) {
      setSearchHasMore(false);
      const message = error instanceof Error ? error.message : 'Beer search failed';
      onError?.(message);
    } finally {
      setIsLoadingSearchPage(false);
    }
  }, [enabled, query, minQueryLength, isLoadingSearchPage, searchHasMore, searchPage, pageSize, onError]);

  const ensureCatalogLoaded = useCallback(() => {
    if (!enabled || catalogBeers.length > 0 || catalogPage > 0) {
      return;
    }

    void loadNextCatalogPage();
  }, [enabled, catalogBeers.length, catalogPage, loadNextCatalogPage]);

  const reset = useCallback(() => {
    setQuery('');
    setSearchResults([]);
    setSearchPage(0);
    setSearchHasMore(false);
    setIsSearching(false);
  }, []);

  const onScroll = useCallback(
    (event: UIEvent<HTMLDivElement>) => {
      if (!enabled) {
        return;
      }

      const element = event.currentTarget;
      const nearBottom = element.scrollTop + element.clientHeight >= element.scrollHeight - 24;

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

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const normalizedQuery = query.trim();

    if (normalizedQuery.length < minQueryLength) {
      setSearchResults([]);
      setSearchPage(0);
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
        const result = await searchBeersPage(normalizedQuery, 1, pageSize);
        setSearchResults(result.items);
        setSearchPage(result.page);
        setSearchHasMore(result.hasMore);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Beer search failed';
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
  };
}
