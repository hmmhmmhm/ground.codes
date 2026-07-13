import {
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
  useCallback,
  useEffect,
  useState,
} from "react";
import type { Locale } from "@/i18n";
import {
  type GroundCodeSearchResult,
  searchGroundCodes,
} from "@/lib/code/ground-codes";
import { parseGroundCodeSharePath } from "@/lib/code/share-url";
import { getGroundCodeLanguage } from "@/lib/i18n/ground-code-language";
import {
  type CelestialBody,
  parseCelestialBody,
} from "@/lib/map/celestial-bodies";
import { type Coordinates, LocationMode } from "../types";

type UseMapSearchOptions = {
  body: CelestialBody;
  center: Coordinates;
  locale: Locale;
  locationMode: LocationMode;
  map: google.maps.Map | null;
  selectBody: (body: CelestialBody) => void;
  setCenter: Dispatch<SetStateAction<google.maps.LatLngLiteral>>;
  setLocationMode: (mode: LocationMode) => void;
  setPlaceDetailsVisible: Dispatch<SetStateAction<boolean>>;
  setSelectedArea: Dispatch<SetStateAction<Coordinates | null>>;
  setSelectedAreaAddress: Dispatch<SetStateAction<string | null>>;
  setSelectedLocation: Dispatch<SetStateAction<google.maps.LatLng | null>>;
  setSelectedPlaceId: Dispatch<SetStateAction<string | null>>;
  setShowInfoWindow: Dispatch<SetStateAction<boolean>>;
  setZoom: Dispatch<SetStateAction<number>>;
  userZoomRef: MutableRefObject<number>;
};

const geocodeEarthQuery = (query: string) =>
  new Promise<GroundCodeSearchResult | null>((resolve) => {
    if (typeof google === "undefined" || !google.maps?.Geocoder) {
      resolve(null);
      return;
    }

    const geocoder = new google.maps.Geocoder();
    let settled = false;
    const timeoutId = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      resolve(null);
    }, 3_500);
    const finish = (result: GroundCodeSearchResult | null) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      resolve(result);
    };

    geocoder.geocode({ address: query }, (results, status) => {
      if (
        status !== google.maps.GeocoderStatus.OK ||
        !results?.[0]?.geometry?.location
      ) {
        finish(null);
        return;
      }

      const result = results[0];
      const location = result.geometry.location;
      finish({
        type: "region",
        label: result.formatted_address ?? query,
        lat: location.lat(),
        lng: location.lng(),
        body: "earth",
        regionLevel: 2,
      });
    });
  });

export const useMapSearch = ({
  body,
  center,
  locale,
  locationMode,
  map,
  selectBody,
  setCenter,
  setLocationMode,
  setPlaceDetailsVisible,
  setSelectedArea,
  setSelectedAreaAddress,
  setSelectedLocation,
  setSelectedPlaceId,
  setShowInfoWindow,
  setZoom,
  userZoomRef,
}: UseMapSearchOptions) => {
  const [searchedPlace, setSearchedPlace] =
    useState<google.maps.places.PlaceResult | null>(null);
  const [isGroundSearchLoading, setIsGroundSearchLoading] = useState(false);
  const [groundSearchError, setGroundSearchError] = useState<string | null>(
    null,
  );
  const [groundSearchResults, setGroundSearchResults] = useState<
    GroundCodeSearchResult[]
  >([]);
  const [initialGroundSearchQuery, setInitialGroundSearchQuery] = useState("");
  const [searchMarker, setSearchMarker] = useState<google.maps.Marker | null>(
    null,
  );
  const [infoWindow, setInfoWindow] = useState<google.maps.InfoWindow | null>(
    null,
  );

  useEffect(() => {
    if (typeof google !== "undefined" && google.maps && !infoWindow) {
      setInfoWindow(new google.maps.InfoWindow());
    }
  }, [infoWindow]);

  const handlePlaceSelect = useCallback(
    (place: google.maps.places.PlaceResult) => {
      if (!place.geometry?.location || !map) return;
      if (locationMode === LocationMode.TRACKING) {
        setLocationMode(LocationMode.OFF);
      }

      setSearchedPlace(place);
      setSelectedAreaAddress(place.formatted_address ?? place.name ?? null);
      if (place.geometry.viewport) map.fitBounds(place.geometry.viewport);
      else {
        map.setCenter(place.geometry.location);
        map.setZoom(17);
      }

      let marker = searchMarker;
      if (!marker) {
        marker = new google.maps.Marker({
          map,
          position: place.geometry.location,
          animation: google.maps.Animation.DROP,
        });
        setSearchMarker(marker);
      } else {
        marker.setPosition(place.geometry.location);
      }

      if (infoWindow) {
        infoWindow.setContent(
          `<div><strong>${place.name || ""}</strong><br>${place.formatted_address || ""}</div>`,
        );
        setShowInfoWindow(false);
        infoWindow.open(map, marker);
      }
      setSelectedArea(place.geometry.location.toJSON());
    },
    [
      infoWindow,
      locationMode,
      map,
      searchMarker,
      setLocationMode,
      setSelectedArea,
      setSelectedAreaAddress,
      setShowInfoWindow,
    ],
  );

  const applyGroundSearchResult = useCallback(
    (result: GroundCodeSearchResult) => {
      const resultBody = parseCelestialBody(String(result.body));
      const nextLocation = { lat: result.lat, lng: result.lng };
      const nextZoom = resultBody === "earth" ? 14 : 5;
      if (resultBody !== body) selectBody(resultBody);
      if (locationMode === LocationMode.TRACKING) {
        setLocationMode(LocationMode.OFF);
      }

      setPlaceDetailsVisible(false);
      setSelectedPlaceId(null);
      setSelectedLocation(null);
      setCenter(nextLocation);
      setZoom(nextZoom);
      userZoomRef.current = nextZoom;
      setSelectedArea(nextLocation);
      setSelectedAreaAddress(
        resultBody === "earth" && result.type !== "ground-code"
          ? result.label
          : null,
      );
      setShowInfoWindow(true);
      if (map && resultBody === body) {
        map.setCenter(nextLocation);
        map.setZoom(nextZoom);
      }
    },
    [
      body,
      locationMode,
      map,
      selectBody,
      setCenter,
      setLocationMode,
      setPlaceDetailsVisible,
      setSelectedArea,
      setSelectedAreaAddress,
      setSelectedLocation,
      setSelectedPlaceId,
      setShowInfoWindow,
      setZoom,
      userZoomRef,
    ],
  );

  const handleGroundSearch = useCallback(
    async (query: string, options?: { body?: CelestialBody }) => {
      const trimmedQuery = query.trim();
      if (!trimmedQuery) return;
      const searchBody = options?.body ?? body;

      try {
        setIsGroundSearchLoading(true);
        setGroundSearchError(null);
        let results: GroundCodeSearchResult[] = [];
        let apiSearchUnavailable = false;
        try {
          const response = await searchGroundCodes({
            query: trimmedQuery,
            language: getGroundCodeLanguage(locale),
            body: searchBody,
            maxResults: 5,
            biasLat: center.lat,
            biasLng: center.lng,
          });
          results = response.results;
        } catch (error) {
          apiSearchUnavailable = true;
          console.warn("Ground code API search unavailable:", error);
        }

        if (results.length === 0 && searchBody === "earth") {
          const geocodedResult = await geocodeEarthQuery(trimmedQuery);
          if (geocodedResult) results = [geocodedResult];
        }
        setGroundSearchResults(results);
        const result = results[0];
        if (!result) {
          setGroundSearchError(
            apiSearchUnavailable
              ? "map.search.unavailable"
              : "map.search.noResults",
          );
          return;
        }
        applyGroundSearchResult(result);
      } catch (error) {
        console.error("Ground code search failed:", error);
        setGroundSearchError("map.search.error");
      } finally {
        setIsGroundSearchLoading(false);
      }
    },
    [applyGroundSearchResult, body, center.lat, center.lng, locale],
  );

  const handleGroundSuggest = useCallback(
    async (query: string) => {
      const trimmedQuery = query.trim();
      if (!trimmedQuery) return [];
      const response = await searchGroundCodes({
        query: trimmedQuery,
        language: getGroundCodeLanguage(locale),
        body,
        maxResults: 5,
        biasLat: center.lat,
        biasLng: center.lng,
      });
      return response.results;
    },
    [body, center.lat, center.lng, locale],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sharedCode = parseGroundCodeSharePath(window.location.pathname);
    if (!sharedCode || initialGroundSearchQuery) return;
    setInitialGroundSearchQuery(sharedCode.code);
    void handleGroundSearch(sharedCode.code, { body: sharedCode.body });
  }, [handleGroundSearch, initialGroundSearchQuery]);

  const cleanupSearch = useCallback(() => {
    searchMarker?.setMap(null);
    infoWindow?.close();
    setSearchMarker(null);
  }, [infoWindow, searchMarker]);

  return {
    applyGroundSearchResult,
    cleanupSearch,
    groundSearchError,
    groundSearchResults,
    handleGroundSearch,
    handleGroundSuggest,
    handlePlaceSelect,
    initialGroundSearchQuery,
    isGroundSearchLoading,
    searchedPlace,
  };
};
