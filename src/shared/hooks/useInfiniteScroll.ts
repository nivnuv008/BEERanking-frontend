import { useEffect, useRef } from "react";

type UseInfiniteScrollOptions = {
  enabled: boolean;
  onIntersect: () => void | Promise<void>;
  rootSelector?: string;
  rootMargin?: string;
  threshold?: number;
};

export function useInfiniteScroll({
  enabled,
  onIntersect,
  rootSelector = ".app-shell__content",
  rootMargin = "0px 0px 260px 0px",
  threshold = 0,
}: UseInfiniteScrollOptions) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const onIntersectRef = useRef(onIntersect);

  useEffect(() => {
    onIntersectRef.current = onIntersect;
  }, [onIntersect]);

  useEffect(() => {
    const sentinel = sentinelRef.current;

    if (!enabled || !sentinel) {
      return;
    }

    const root = document.querySelector(rootSelector);
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];

        if (entry?.isIntersecting) {
          void onIntersectRef.current();
        }
      },
      {
        root,
        rootMargin,
        threshold,
      },
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [enabled, rootMargin, rootSelector, threshold]);

  return { sentinelRef };
}
