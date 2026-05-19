import React, { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/i18n-context";
import { GroundCodeSearchResult } from "@/lib/code/ground-codes";

interface MapSearchProps {
  map: google.maps.Map | null;
  onPlaceSelect?: (place: google.maps.places.PlaceResult) => void;
  onGroundSearch: (query: string) => Promise<void> | void;
  onGroundSearchResultSelect: (result: GroundCodeSearchResult) => void;
  isGroundSearchLoading: boolean;
  groundSearchError: string | null;
  groundSearchResults: GroundCodeSearchResult[];
  initialQuery?: string | null;
}

const MapSearch: React.FC<MapSearchProps> = ({
  map,
  onPlaceSelect,
  onGroundSearch,
  onGroundSearchResultSelect,
  isGroundSearchLoading,
  groundSearchError,
  groundSearchResults,
  initialQuery = null,
}) => {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [placePredictions, setPlacePredictions] = useState<
    google.maps.places.AutocompletePrediction[]
  >([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const autocompleteServiceRef =
    useRef<google.maps.places.AutocompleteService | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const predictionCacheRef = useRef<
    Map<string, google.maps.places.AutocompletePrediction[]>
  >(new Map());
  const predictionRequestIdRef = useRef(0);
  const suppressedPredictionQueryRef = useRef<string | null>(null);

  useEffect(() => {
    if (initialQuery && !query) {
      setQuery(initialQuery);
    }
  }, [initialQuery, query]);

  useEffect(() => {
    if (!map || !searchInputRef.current || !onPlaceSelect) return;
    if (typeof google === "undefined" || !google.maps?.places) return;

    // Initialize the InfoWindow
    infoWindowRef.current = new google.maps.InfoWindow();

    // Initialize the Autocomplete
    autocompleteRef.current = new google.maps.places.Autocomplete(
      searchInputRef.current,
      {
        fields: ["address_components", "geometry", "name", "formatted_address"],
      }
    );

    autocompleteRef.current.bindTo("bounds", map);

    // Add listener for place selection
    const listener = autocompleteRef.current.addListener(
      "place_changed",
      () => {
        const place = autocompleteRef.current?.getPlace();

        if (!place?.geometry?.location) {
          window.alert(
            `No details available for: ${place?.name || "this place"}`
          );
          return;
        }

        setQuery(place.name ?? searchInputRef.current?.value ?? "");
        onPlaceSelect(place);
      }
    );

    return () => {
      // Clean up listener when component unmounts
      if (listener) {
        google.maps.event.removeListener(listener);
      }
    };
  }, [map, onPlaceSelect]);

  useEffect(() => {
    const trimmedQuery = query.trim();
    const normalizedQuery = trimmedQuery.toLocaleLowerCase();
    const requestId = predictionRequestIdRef.current + 1;
    predictionRequestIdRef.current = requestId;

    if (
      trimmedQuery.length < 2 ||
      isGroundSearchLoading ||
      normalizedQuery === suppressedPredictionQueryRef.current
    ) {
      setPlacePredictions([]);
      return;
    }

    const cachedPredictions = predictionCacheRef.current.get(normalizedQuery);
    if (cachedPredictions) {
      setPlacePredictions(cachedPredictions);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      if (
        typeof google === "undefined" ||
        !google.maps?.places?.AutocompleteService
      ) {
        return;
      }

      autocompleteServiceRef.current ??=
        new google.maps.places.AutocompleteService();

      autocompleteServiceRef.current.getPlacePredictions(
        {
          input: trimmedQuery,
        },
        (predictions, status) => {
          if (requestId !== predictionRequestIdRef.current) return;

          const nextPredictions =
            status === google.maps.places.PlacesServiceStatus.OK
              ? (predictions ?? []).slice(0, 5)
              : [];

          predictionCacheRef.current.set(normalizedQuery, nextPredictions);
          if (predictionCacheRef.current.size > 30) {
            const oldestQuery = predictionCacheRef.current.keys().next().value;
            if (oldestQuery) {
              predictionCacheRef.current.delete(oldestQuery);
            }
          }

          setPlacePredictions(nextPredictions);
        }
      );
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isGroundSearchLoading, query]);

  const submitSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedQuery = (searchInputRef.current?.value ?? query).trim();
    if (!trimmedQuery || isGroundSearchLoading) return;
    predictionRequestIdRef.current += 1;
    suppressedPredictionQueryRef.current = trimmedQuery.toLocaleLowerCase();
    setPlacePredictions([]);
    setQuery(trimmedQuery);
    await onGroundSearch(trimmedQuery);
  };

  const selectPlacePrediction = async (
    prediction: google.maps.places.AutocompletePrediction
  ) => {
    if (isGroundSearchLoading) return;

    predictionRequestIdRef.current += 1;
    suppressedPredictionQueryRef.current =
      prediction.description.trim().toLocaleLowerCase();
    setQuery(prediction.description);
    setPlacePredictions([]);
    await onGroundSearch(prediction.description);
  };

  const translatedGroundSearchError = groundSearchError?.startsWith("map.")
    ? t(groundSearchError)
    : groundSearchError;

  return (
    <form
      className="absolute top-[max(16px,env(safe-area-inset-top))] left-1/2 z-20 w-[min(calc(100%-24px),30rem)] -translate-x-1/2"
      onSubmit={submitSearch}
    >
      <div className="relative overflow-hidden rounded-lg border border-white/20 bg-black/45 shadow-lg backdrop-blur-md">
        <input
          ref={searchInputRef}
          type="text"
          value={query}
          onChange={(event) => {
            suppressedPredictionQueryRef.current = null;
            setQuery(event.target.value);
          }}
          onInput={(event) => {
            suppressedPredictionQueryRef.current = null;
            setQuery(event.currentTarget.value);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setPlacePredictions([]);
            }
          }}
          placeholder={t("map.search.placeholder")}
          className="h-11 w-full bg-transparent py-2 pl-10 pr-12 text-sm text-white placeholder:text-white/70 focus:outline-none"
          aria-label={t("map.search.placeholder")}
        />
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <svg
            className="h-5 w-5 text-white/80"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <button
          type="submit"
          className="absolute inset-y-1 right-1 flex w-9 items-center justify-center rounded-md text-white/85 transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isGroundSearchLoading}
          aria-label={t("map.search.submit")}
          title={t("map.search.submit")}
          data-testid="ground-search-submit"
        >
          {isGroundSearchLoading ? (
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
              data-testid="ground-search-loading"
            />
          ) : (
            <svg
              className="h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M3 10a1 1 0 0 1 1-1h9.586l-3.293-3.293a1 1 0 1 1 1.414-1.414l5 5a1 1 0 0 1 0 1.414l-5 5a1 1 0 0 1-1.414-1.414L13.586 11H4a1 1 0 0 1-1-1Z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </button>
      </div>
      {placePredictions.length > 0 && (
        <div
          className="mt-2 overflow-hidden rounded-lg border border-white/15 bg-black/75 text-white shadow-lg backdrop-blur-md"
          role="listbox"
        >
          <div className="border-b border-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/55">
            {t("map.search.placesHeading")}
          </div>
          {placePredictions.map((prediction) => {
            const mainText =
              prediction.structured_formatting?.main_text ??
              prediction.description;
            const secondaryText =
              prediction.structured_formatting?.secondary_text;

            return (
              <button
                key={prediction.place_id}
                type="button"
                className="flex w-full flex-col border-b border-white/10 px-3 py-2 text-left last:border-b-0 hover:bg-white/10 focus:bg-white/10 focus:outline-none"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectPlacePrediction(prediction)}
                role="option"
                aria-selected="false"
              >
                <span className="truncate text-sm font-medium">{mainText}</span>
                {secondaryText && (
                  <span className="truncate text-xs text-white/60">
                    {secondaryText}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
      {translatedGroundSearchError && (
        <div className="mx-auto mt-2 w-fit max-w-full rounded-md border border-red-300/30 bg-red-950/80 px-3 py-1 text-xs text-red-100 shadow-lg backdrop-blur-md">
          {translatedGroundSearchError}
        </div>
      )}
      {groundSearchResults.length > 1 && (
        <div className="mt-2 overflow-hidden rounded-lg border border-white/15 bg-black/70 text-white shadow-lg backdrop-blur-md">
          <div className="border-b border-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/55">
            {t("map.search.groundCodesHeading")}
          </div>
          {groundSearchResults.map((result) => (
            <button
              key={`${result.body}:${result.regionLevel}:${result.code ?? result.label}:${result.lat}:${result.lng}`}
              type="button"
              className="flex w-full items-center justify-between gap-3 border-b border-white/10 px-3 py-2 text-left text-sm last:border-b-0 hover:bg-white/10"
              onClick={() => onGroundSearchResultSelect(result)}
            >
              <span className="min-w-0">
                <span className="block truncate font-medium">
                  {result.label}
                </span>
                <span className="block truncate text-xs text-white/60">
                  {result.code ?? `${result.lat.toFixed(4)}, ${result.lng.toFixed(4)}`}
                </span>
              </span>
              <span className="shrink-0 text-xs uppercase text-white/50">
                {result.body}
              </span>
            </button>
          ))}
        </div>
      )}
    </form>
  );
};

export default MapSearch;
