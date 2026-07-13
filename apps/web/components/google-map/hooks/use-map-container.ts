import { useState, useCallback, useEffect, useRef } from "react";
import { useGridSystem } from "@/lib/grid-system";
import { useMapCoordinates } from "./use-map-coordinates";
import { useGeolocation } from "./use-geolocation";
import { useJsApiLoader } from "@react-google-maps/api";
import { useLanguage } from "./use-language";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useLocationTracking } from "./use-location-tracking";
import { Coordinates, LocationMode } from "../types";
import {
  CelestialBody,
  getDefaultPlanetaryLayerId,
  getDefaultViewForBody,
  getPlanetaryLayerConfig,
  METERS_PER_DEGREE_BY_BODY,
} from "@/lib/map/celestial-bodies";
import {
  type EarthMapType,
  getDefaultMapTypeForBody,
  getInitialBody,
  getInitialCenter,
  getInitialMapType,
  getInitialPlanetaryLayerId,
  getInitialZoom,
  libraries,
} from "./map-container-initial-state";
import { useMapSearch } from "./use-map-search";
import { useMapControls } from "./use-map-controls";
import { useMapPresentation } from "./use-map-presentation";
import { useMapLifecycle } from "./use-map-lifecycle";

export type { EarthMapType } from "./map-container-initial-state";

export const useMapContainer = () => {
  const { getUserLanguage } = useLanguage();
  const { isChangingLanguage, locale } = useI18n();
  const [body, setBody] = useState<CelestialBody>(getInitialBody);
  const isEarth = body === "earth";
  const [planetaryLayerId, setPlanetaryLayerId] = useState(() =>
    getInitialPlanetaryLayerId(body),
  );

  // Get language from cookie for Google Maps API
  const mapLanguage = isChangingLanguage ? "en" : getUserLanguage();
  const googleMapsApiKey =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? "";
  const hasGoogleMapsApiKey = googleMapsApiKey.length > 0;

  // Load Google Maps API. The hook must be called unconditionally.
  const { isLoaded: isGoogleMapsLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: googleMapsApiKey || "missing-google-maps-api-key",
    language: mapLanguage,
    libraries,
  });
  const isLoaded = hasGoogleMapsApiKey ? isGoogleMapsLoaded : true;

  // Map state
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [center, setCenter] = useState(() => getInitialCenter(body));
  const [mapType, setMapType] = useState<EarthMapType>(() =>
    getInitialMapType(body),
  );
  const [zoom, setZoom] = useState(() => getInitialZoom(body));
  const userZoomRef = useRef<number>(getInitialZoom(body));

  // User location state
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [userLocationLoaded, setUserLocationLoaded] = useState(false);
  const prevLocationRef = useRef<Coordinates | null>(null);

  // Place Details UI state
  const [placeDetailsVisible, setPlaceDetailsVisible] = useState(false);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] =
    useState<google.maps.LatLng | null>(null);

  // Loading state
  const [isLoading, setIsLoading] = useState(false);

  // Grid state
  const [showGrid, setShowGrid] = useState(true);
  const {
    isFullscreen,
    mapHeading,
    mapTilt,
    onHeadingChanged,
    onTiltChanged,
    resetMapHeading,
    selectMapType,
    setMapHeadingValue,
    toggleFullscreen,
  } = useMapControls({
    map,
    mapType,
    setMapType,
    setShowGrid,
    showGrid,
  });

  // Selected area state
  const [selectedArea, setSelectedArea] = useState<Coordinates | null>(null);
  const [selectedAreaAddress, setSelectedAreaAddress] = useState<string | null>(
    null,
  );

  // Show info window state
  const [showInfoWindow, setShowInfoWindow] = useState(false);

  // Location tracking
  const {
    locationMode,
    setLocationMode,
    isLoadingLocation,
    startLocationTracking,
    stopLocationTracking,
  } = useLocationTracking({
    map,
    onLocationUpdate: useCallback((location) => {
      if (location) {
        // Explicitly include heading information in state update
        setUserLocation({
          lat: location.lat,
          lng: location.lng,
          accuracy: location.accuracy,
          heading: location.heading,
        });

        setUserLocationLoaded(true);
      }
    }, []),
  });

  // Synchronize loading state - empty dependency array
  useEffect(() => {
    // Directly reference the latest isLoadingLocation value
    if (isLoadingLocation !== undefined) {
      setIsLoading(isLoadingLocation);
    }
  }, [isLoadingLocation]);

  // Get user location using the hook
  const { getUserLocation: getGeoLocation, cancelGeolocationRequest } =
    useGeolocation(map, setCenter, setSelectedArea, {
      autoGetLocation: isEarth,
      initialFetch: isEarth,
    });

  // Location tracking start function
  const startWatchingPosition = useCallback(() => {
    startLocationTracking();
  }, [startLocationTracking]);

  // Location tracking stop function
  const stopWatchingPosition = useCallback(() => {
    stopLocationTracking();
  }, [stopLocationTracking]);

  // Location mode change update tracking state
  useEffect(() => {
    if (!isEarth) {
      setLocationMode(LocationMode.OFF);
      cancelGeolocationRequest();
      stopWatchingPosition();
      return;
    }

    // Perform different actions based on location mode
    if (locationMode === LocationMode.OFF) {
      // OFF mode: stop location tracking
      stopWatchingPosition();

      // Cancel location request and reset loading state
      cancelGeolocationRequest();

      // Reset previous location reference to start from scratch when location mode is activated
      prevLocationRef.current = null;
    } else if (locationMode === LocationMode.LOCATE) {
      // LOCATE mode: location confirmation
      // Check if location information exists
      if (!userLocationLoaded) {
        // Execute getCurrentPosition if location information does not exist
        getGeoLocation();
      }
    } else if (locationMode === LocationMode.TRACKING) {
      // TRACKING mode: start location tracking
      // Check if location information exists
      if (!userLocationLoaded || !userLocation) {
        // Execute getCurrentPosition if location information does not exist
        getGeoLocation();
      }

      // Start location tracking (watchPosition)
      startWatchingPosition();
    }
  }, [
    locationMode,
    startWatchingPosition,
    stopWatchingPosition,
    cancelGeolocationRequest,
    userLocationLoaded,
    userLocation,
    getGeoLocation,
    isEarth,
    setLocationMode,
  ]);

  // Get user location function
  const getUserLocation = useCallback(() => {
    if (!isEarth) return;

    // Toggle location mode (OFF -> LOCATE -> TRACKING -> OFF)
    if (locationMode === LocationMode.OFF) {
      setLocationMode(LocationMode.LOCATE);
    } else if (locationMode === LocationMode.LOCATE) {
      setLocationMode(LocationMode.TRACKING);
    } else {
      setLocationMode(LocationMode.OFF);
    }
  }, [locationMode, setLocationMode, isEarth]);

  // Get encoded coordinates using the hook
  const { encodedCoordinates, isEncoding, encodeSelectedAreaCoordinates } =
    useMapCoordinates(selectedArea, body);

  // Get grid system functions using the hook
  const {
    drawGrid,
    clearAllGridLines,
    setupMapEventHandlers,
    removeMapEventHandlers,
  } = useGridSystem(showGrid, selectedArea, setSelectedArea, {
    locationMode,
    setLocationMode: (mode) => setLocationMode(mode as LocationMode),
    placeDetailsVisible,
    setPlaceDetailsVisible,
    setSelectedPlaceId,
    setSelectedLocation,
    setShowInfoWindow,
    metersPerDegree: METERS_PER_DEGREE_BY_BODY[body],
  });

  // Handle map interaction (e.g., click) to disable location tracking
  const handleMapInteraction = useCallback(() => {
    if (!isEarth) return;

    if (locationMode === LocationMode.TRACKING) {
      setLocationMode(LocationMode.OFF);
    }
  }, [locationMode, setLocationMode, isEarth]);

  const selectBody = useCallback(
    (nextBody: CelestialBody) => {
      if (nextBody === body) return;

      const nextView = getDefaultViewForBody(nextBody);
      const nextMapType = getDefaultMapTypeForBody(nextBody);
      setBody(nextBody);
      if (nextBody !== "earth") {
        setPlanetaryLayerId(getDefaultPlanetaryLayerId(nextBody));
      }
      setMapType(nextMapType);
      document.cookie = `MAP_TYPE=${nextMapType};path=/;max-age=31536000`;
      setCenter(nextView.center);
      setZoom(nextView.zoom);
      userZoomRef.current = nextView.zoom;
      setSelectedArea(null);
      setShowInfoWindow(false);

      if (map) {
        map.setCenter(nextView.center);
        map.setZoom(nextView.zoom);
      }
    },
    [body, map],
  );

  const {
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
  } = useMapSearch({
    body,
    center,
    locale,
    locationMode,
    map,
    selectBody,
    setCenter,
    setLocationMode: (mode) => setLocationMode(mode),
    setPlaceDetailsVisible,
    setSelectedArea,
    setSelectedAreaAddress,
    setSelectedLocation,
    setSelectedPlaceId,
    setShowInfoWindow,
    setZoom,
    userZoomRef,
  });

  useMapPresentation({
    body,
    center,
    clearAllGridLines,
    drawGrid,
    map,
    mapType,
    planetaryLayerId,
    showGrid,
    zoom,
  });

  // Close place details
  const closePlaceDetails = useCallback(() => {
    setPlaceDetailsVisible(false);
    setSelectedPlaceId(null);
    setSelectedLocation(null);

    // When Place Details is closed, show InfoWindow
    setShowInfoWindow(true);
  }, [setShowInfoWindow]);

  const { onLoad, onUnmount, onZoomChanged } = useMapLifecycle({
    body,
    cleanupSearch,
    clearAllGridLines,
    drawGrid,
    encodeSelectedAreaCoordinates,
    handleMapInteraction,
    hasGoogleMapsApiKey,
    isEarth,
    isGoogleMapsLoaded,
    map,
    mapType,
    onHeadingChanged,
    onTiltChanged,
    planetaryLayerId,
    removeMapEventHandlers,
    selectedArea,
    setMap,
    setSelectedAreaAddress,
    setZoom,
    setupMapEventHandlers,
    showGrid,
    stopLocationTracking,
    userZoomRef,
  });

  const activePlanetaryLayer =
    body === "earth" ? null : getPlanetaryLayerConfig(body, planetaryLayerId);

  return {
    // Map state
    isLoaded,
    hasGoogleMapsApiKey,
    map,
    center,
    zoom,
    mapType,
    selectMapType,
    body,
    isEarth,
    selectBody,
    planetaryAttribution: activePlanetaryLayer?.attribution ?? null,
    mapHeading,
    mapTilt,
    resetMapHeading,
    setMapHeading: setMapHeadingValue,
    isFullscreen,
    toggleFullscreen,

    // User location state
    userLocation,
    userLocationLoaded,
    getUserLocation,
    isLoading,
    isTrackingLocation: locationMode === LocationMode.TRACKING,
    locationMode,

    // Grid state
    showGrid,
    toggleGrid: () => {
      const newShowGrid = !showGrid;
      setShowGrid(newShowGrid);

      if (map) {
        if (newShowGrid) {
          drawGrid(map);
        } else {
          clearAllGridLines();
        }
      }
    },

    // Selected area state
    selectedArea,
    selectedAreaAddress,
    setSelectedArea,

    // Search state
    searchedPlace,
    handlePlaceSelect,
    handleGroundSearch,
    handleGroundSuggest,
    handleGroundSearchResultSelect: applyGroundSearchResult,
    isGroundSearchLoading,
    groundSearchError,
    groundSearchResults,
    initialGroundSearchQuery,

    // Place Details state
    placeDetailsVisible,
    selectedPlaceId,
    selectedLocation,
    closePlaceDetails,

    // Coordinates encoding state
    encodedCoordinates,
    isEncoding,

    // InfoWindow state
    showInfoWindow,
    setShowInfoWindow,

    // Map event handlers
    onLoad,
    onUnmount,
    onZoomChanged,
  };
};
