import type { UIEvent } from "react";
import type { Beer } from "../api/beerApi";

type BeerSearchPickerProps = {
  inputId: string;
  label?: string;
  query: string;
  minQueryLength?: number;
  placeholder: string;
  onQueryChange: (value: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  isOpen: boolean;
  beers: Beer[];
  hasActiveQuery: boolean;
  isSearching: boolean;
  isLoadingMore: boolean;
  onScroll: (event: UIEvent<HTMLDivElement>) => void;
  onSelect: (beer: Beer) => void;
  isResultDisabled?: (beer: Beer) => boolean;
  getActionLabel?: (beer: Beer) => string;
  renderMeta?: (beer: Beer) => string;
  showClearButton?: boolean;
  onClear?: () => void;
  clearButtonLabel?: string;
  searchingText?: string;
  noResultsText?: string;
  minCharsText?: string;
  loadingMoreText?: string;
  preResultsContent?: React.ReactNode;
  inputRowClassName?: string;
  inputClassName?: string;
  clearButtonClassName?: string;
  resultsClassName: string;
  resultClassName: string;
  helperClassName: string;
};

function defaultGetActionLabel(): string {
  return "Select";
}

function defaultRenderMeta(beer: Beer): string {
  return `${beer.brewery} - ${beer.style}`;
}

export default function BeerSearchPicker({
  inputId,
  label,
  query,
  minQueryLength = 2,
  placeholder,
  onQueryChange,
  onFocus,
  onBlur,
  isOpen,
  beers,
  hasActiveQuery,
  isSearching,
  isLoadingMore,
  onScroll,
  onSelect,
  isResultDisabled,
  getActionLabel = defaultGetActionLabel,
  renderMeta = defaultRenderMeta,
  showClearButton = false,
  onClear,
  clearButtonLabel = "Clear",
  searchingText = "Searching beers...",
  noResultsText = "No beers matched this search.",
  minCharsText,
  loadingMoreText = "Loading more beers...",
  preResultsContent,
  inputRowClassName,
  inputClassName,
  clearButtonClassName,
  resultsClassName,
  resultClassName,
  helperClassName,
}: BeerSearchPickerProps) {
  const trimmedQueryLength = query.trim().length;
  const effectiveMinCharsText =
    minCharsText ?? `Type at least ${minQueryLength} characters to search.`;

  return (
    <>
      {label ? (
        <label htmlFor={inputId} className="create-post-form__label">
          {label}
        </label>
      ) : null}

      <div className={inputRowClassName}>
        <input
          id={inputId}
          type="text"
          className={inputClassName}
          placeholder={placeholder}
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          autoComplete="off"
        />

        {showClearButton && onClear ? (
          <button
            type="button"
            className={clearButtonClassName}
            onClick={onClear}
          >
            {clearButtonLabel}
          </button>
        ) : null}
      </div>

      {preResultsContent}

      {isOpen ? (
        <div
          className={resultsClassName}
          aria-live="polite"
          onScroll={onScroll}
        >
          {trimmedQueryLength > 0 && trimmedQueryLength < minQueryLength ? (
            <p className={helperClassName}>{effectiveMinCharsText}</p>
          ) : null}
          {isSearching ? (
            <p className={helperClassName}>{searchingText}</p>
          ) : null}
          {!isSearching && hasActiveQuery && beers.length === 0 ? (
            <p className={helperClassName}>{noResultsText}</p>
          ) : null}

          {!isSearching
            ? beers.map((beer) => {
                const disabled = isResultDisabled?.(beer) ?? false;
                return (
                  <button
                    key={beer._id}
                    type="button"
                    className={resultClassName}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => onSelect(beer)}
                    disabled={disabled}
                  >
                    <span>
                      <strong>{beer.name}</strong>
                      <small>{renderMeta(beer)}</small>
                    </span>
                    <span>{getActionLabel(beer)}</span>
                  </button>
                );
              })
            : null}

          {isLoadingMore ? (
            <p className={helperClassName}>{loadingMoreText}</p>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
