import { useState, useCallback, useEffect, useRef } from "react";
import { useGridSystem } from "@/lib/grid-system";
import { useMapCoordinates } from "./use-map-coordinates";
import { useGeolocation } from "./use-geolocation";
import { googleMapDarkTheme } from "@/lib/map/google-map-theme";
import { useJsApiLoader } from "@react-google-maps/api";
import { useLanguage } from "./use-language";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useLocationTracking } from "./use-location-tracking";
import { Coordinates, LocationMode } from "../types";
import {
  CelestialBody,
  createPlanetaryMapType,
  getDefaultPlanetaryLayerId,
  getDefaultViewForBody,
  getPlanetaryLayerConfig,
  METERS_PER_DEGREE_BY_BODY,
  parseCelestialBody,
  parsePlanetaryLayerId,
  PLANETARY_BODY_CONFIGS,
} from "@/lib/map/celestial-bodies";

// Define libraries array as a constant to prevent recreation on each render
const libraries: "places"[] = ["places"];

// Get map type from cookie
const getMapTypeFromCookie = (): string => {
  try {
    if (typeof window === "undefined") return "roadmap";

    const cookieMapTypeMatch = document.cookie
      .split("; ")
      .find((row) => row.startsWith("MAP_TYPE="));

    const cookieMapType = cookieMapTypeMatch
      ? cookieMapTypeMatch.split("=")[1]
      : undefined;

    if (
      cookieMapType &&
      (cookieMapType === "roadmap" || cookieMapType === "satellite")
    ) {
      return cookieMapType;
    }

    return "roadmap";
  } catch (error) {
    console.error("Error getting map type from cookie:", error);
    return "roadmap";
  }
};

const getInitialBody = (): CelestialBody => {
  if (typeof window === "undefined") return "earth";
  return parseCelestialBody(
    new URLSearchParams(window.location.search).get("body")
  );
};

const getInitialPlanetaryLayerId = (body: CelestialBody) => {
  if (body === "earth") return getDefaultPlanetaryLayerId("moon");

  const layerId =
    typeof window === "undefined"
      ? null
      : new URLSearchParams(window.location.search).get("layer");
  return parsePlanetaryLayerId(body, layerId);
};

const getInitialCenter = (body: CelestialBody): google.maps.LatLngLiteral => {
  const defaultView = getDefaultViewForBody(body);
  if (typeof window === "undefined") return defaultView.center;

  const params = new URLSearchParams(window.location.search);
  const lat = Number(params.get("lat"));
  const lng = Number(params.get("lng"));
  if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };

  return defaultView.center;
};

const getInitialZoom = (body: CelestialBody): number => {
  const defaultView = getDefaultViewForBody(body);
  if (typeof window === "undefined") return defaultView.zoom;

  const zoom = Number(new URLSearchParams(window.location.search).get("zoom"));
  return Number.isFinite(zoom) ? zoom : defaultView.zoom;
};

export const useMapContainer = () => {
  const { getUserLanguage } = useLanguage();
  const { isChangingLanguage } = useI18n();
  const [body, setBody] = useState<CelestialBody>(getInitialBody);
  const isEarth = body === "earth";
  const [planetaryLayerId, setPlanetaryLayerId] = useState(() =>
    getInitialPlanetaryLayerId(body)
  );

  // Get language from cookie for Google Maps API
  const mapLanguage = isChangingLanguage ? "en" : getUserLanguage();

  // Load Google Maps API
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    language: mapLanguage, // Language code for Google Maps API
    libraries, // Use the constant libraries array
  });

  // Map state
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [center, setCenter] = useState(() => getInitialCenter(body));
  const [mapType, setMapType] = useState<string>(getMapTypeFromCookie());
  const [zoom, setZoom] = useState(() => getInitialZoom(body));
  const userZoomRef = useRef<number>(getInitialZoom(body));
  const [mapHeading, setMapHeading] = useState(0);
  const [mapTilt, setMapTilt] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

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
  const [gridWasVisible, setGridWasVisible] = useState(true);

  // Selected area state
  const [selectedArea, setSelectedArea] = useState<Coordinates | null>(null);

  // Search result state
  const [searchedPlace, setSearchedPlace] =
    useState<google.maps.places.PlaceResult | null>(null);
  const [searchMarker, setSearchMarker] = useState<google.maps.Marker | null>(
    null
  );
  const [infoWindow, setInfoWindow] = useState<google.maps.InfoWindow | null>(
    null
  );

  // Show info window state
  const [showInfoWindow, setShowInfoWindow] = useState(false);

  // Location tracking
  const {
    locationMode,
    setLocationMode,
    isLoadingLocation,
    isTrackingLocation,
    startLocationTracking,
    stopLocationTracking,
    toggleLocationMode,
  } = useLocationTracking({
    map,
    isTrackingMode: true,
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
    // Empty dependency array to run only once on mount
  }, []);

  // Get user location using the hook
  const {
    userLocation: geoLocation,
    getUserLocation: getGeoLocation,
    cancelGeolocationRequest,
    requestOrientationPermission,
  } = useGeolocation(map, setCenter, setSelectedArea, {
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
  ]);

  // Toggle map type between roadmap and satellite
  const toggleMapType = useCallback(() => {
    const newType = mapType === "roadmap" ? "satellite" : "roadmap";

    // Display refresh warning to user
    const confirmMessage = "Map type change will refresh the page. Continue?";
    const userConfirmed = window.confirm(confirmMessage);

    if (!userConfirmed) return;

    try {
      // Store map type in cookie (1 year validity)
      document.cookie = `MAP_TYPE=${newType};path=/;max-age=31536000`;

      // Refresh page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 10);
    } catch (error) {
      console.error("Failed to change map type:", error);
    }
  }, [mapType]);

  // Reset map heading to 0 (north)
  const resetMapHeading = useCallback(() => {
    if (map) {
      map.setHeading(0);
      setMapHeading(0);
    }
  }, [map]);

  // Set map heading to a specific value
  const setMapHeadingValue = useCallback(
    (heading: number) => {
      if (map) {
        // Set map to be rotatable
        map.setOptions({ rotateControl: true });
        map.setHeading(heading);
        setMapHeading(heading);
      } else {
        console.warn("Map is not initialized yet");
      }
    },
    [map]
  );

  // Map heading change handler
  const onHeadingChanged = useCallback(() => {
    if (map) {
      const newHeading = map.getHeading();
      if (newHeading !== undefined) {
        setMapHeading(newHeading);

        // If rotation is present, turn off grid
        if (newHeading !== 0 && showGrid) {
          setGridWasVisible(true); // Store current grid state
          setShowGrid(false); // Turn off grid
        }
        // If rotation is absent and grid was previously on, turn it back on
        else if (
          newHeading === 0 &&
          !showGrid &&
          gridWasVisible &&
          mapTilt === 0
        ) {
          setShowGrid(true); // Turn grid back on
          setGridWasVisible(false); // Reset state
        }
      }
    }
  }, [map, showGrid, mapTilt, gridWasVisible]);

  // Map tilt change handler
  const onTiltChanged = useCallback(() => {
    if (map) {
      const newTilt = map.getTilt();
      if (newTilt !== undefined) {
        setMapTilt(newTilt);

        // If tilt is present, turn off grid
        if (newTilt !== 0 && showGrid) {
          setGridWasVisible(true); // Store current grid state
          setShowGrid(false); // Turn off grid
        }
        // If tilt is absent and grid was previously on, turn it back on
        else if (
          newTilt === 0 &&
          !showGrid &&
          gridWasVisible &&
          mapHeading === 0
        ) {
          setShowGrid(true); // Turn grid back on
          setGridWasVisible(false); // Reset state
        }
      }
    }
  }, [map, showGrid, mapHeading, gridWasVisible]);

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

  // Toggle fullscreen function
  const toggleFullscreen = useCallback(() => {
    const mapContainer = document.querySelector(".map-container");

    if (!mapContainer) return;

    if (!document.fullscreenElement) {
      mapContainer.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Listen for fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

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
    setLocationMode,
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
      setBody(nextBody);
      if (nextBody !== "earth") {
        setPlanetaryLayerId(getDefaultPlanetaryLayerId(nextBody));
      }
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
    [body, map]
  );

  const selectPlanetaryLayer = useCallback(
    (layerId: string) => {
      if (body === "earth") return;
      const nextLayerId = parsePlanetaryLayerId(body, layerId);
      setPlanetaryLayerId(nextLayerId);
    },
    [body]
  );

  useEffect(() => {
    if (!map) return;

    if (body === "earth") {
      map.setOptions({ clickableIcons: true });
      if (mapType === "roadmap") {
        map.setOptions({
          styles:
            process.env.NEXT_PUBLIC_GOOGLE_MAPS_ROADMAP_ID !== undefined
              ? null
              : googleMapDarkTheme,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_ROADMAP_ID,
        });
      } else {
        map.setOptions({
          styles: [],
          mapTypeControlOptions: {
            mapTypeIds: [google.maps.MapTypeId.HYBRID],
          },
          mapId: null,
        });
        map.setMapTypeId(google.maps.MapTypeId.HYBRID);
      }
      return;
    }

    const planetaryMapType = createPlanetaryMapType(body, planetaryLayerId);
    map.mapTypes.set(body, planetaryMapType);
    map.setOptions({
      clickableIcons: false,
      styles: [],
      backgroundColor: "#050505",
      mapTypeControlOptions: { mapTypeIds: [body] },
      mapId: null,
    });
    map.setMapTypeId(body);
  }, [body, map, mapType, planetaryLayerId]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    if (body === "earth") {
      params.delete("body");
      params.delete("layer");
      params.delete("lat");
      params.delete("lng");
      params.delete("zoom");
    } else {
      params.set("body", body);
      params.set("layer", planetaryLayerId);
      params.set("lat", center.lat.toFixed(5));
      params.set("lng", center.lng.toFixed(5));
      params.set("zoom", String(zoom));
    }

    const query = params.toString();
    const nextUrl = `${window.location.pathname}${query ? `?${query}` : ""}`;
    window.history.replaceState(null, "", nextUrl);
  }, [body, center, zoom, planetaryLayerId]);

  // Close place details
  const closePlaceDetails = useCallback(() => {
    setPlaceDetailsVisible(false);
    setSelectedPlaceId(null);
    setSelectedLocation(null);

    // When Place Details is closed, show InfoWindow
    setShowInfoWindow(true);
  }, [setShowInfoWindow]);

  // Setup map event handlers when map is ready
  useEffect(() => {
    if (map) {
      removeMapEventHandlers(map);
      setupMapEventHandlers(map);

      if (!showGrid) {
        clearAllGridLines();
      } else {
        drawGrid(map);
      }

      // Add map drag start listener
      map.addListener("dragstart", handleMapInteraction);

      // Add heading changed listener
      map.addListener("heading_changed", () => {
        onHeadingChanged();
      });

      // Add tilt changed listener
      map.addListener("tilt_changed", () => {
        onTiltChanged();
      });

      return () => {
        if (map) {
          google.maps.event.clearListeners(map, "dragstart");
          google.maps.event.clearListeners(map, "heading_changed");
          google.maps.event.clearListeners(map, "tilt_changed");
        }
      };
    }
  }, [
    showGrid,
    map,
    setupMapEventHandlers,
    removeMapEventHandlers,
    clearAllGridLines,
    drawGrid,
    selectedArea,
    handleMapInteraction,
    onHeadingChanged,
    onTiltChanged,
  ]);

  // Encode coordinates when selected area changes
  useEffect(() => {
    if (selectedArea) {
      encodeSelectedAreaCoordinates();
    }
  }, [selectedArea, encodeSelectedAreaCoordinates]);

  // Initialize InfoWindow
  useEffect(() => {
    if (isLoaded && !infoWindow) {
      setInfoWindow(new google.maps.InfoWindow());
    }
  }, [isLoaded, infoWindow]);

  // Handle place selection from search
  const handlePlaceSelect = useCallback(
    (place: google.maps.places.PlaceResult) => {
      if (!place.geometry || !place.geometry.location || !map) return;

      // When place is selected, disable location tracking
      if (locationMode === LocationMode.TRACKING) {
        setLocationMode(LocationMode.OFF);
      }

      setSearchedPlace(place);

      // Adjust map view based on place geometry
      if (place.geometry.viewport) {
        map.fitBounds(place.geometry.viewport);
      } else {
        map.setCenter(place.geometry.location);
        map.setZoom(17);
      }

      // Create or update marker
      if (!searchMarker) {
        const marker = new google.maps.Marker({
          map,
          position: place.geometry.location,
          animation: google.maps.Animation.DROP,
        });
        setSearchMarker(marker);
      } else {
        searchMarker.setPosition(place.geometry.location);
      }

      // Show info window
      if (infoWindow && searchMarker) {
        const content = `
        <div>
          <strong>${place.name || ""}</strong><br>
          ${place.formatted_address || ""}
        </div>
      `;
        infoWindow.setContent(content);

        // Keep search result InfoWindow open
        // Hide ground codes InfoWindow
        setShowInfoWindow(false);

        infoWindow.open(map, searchMarker);
      }

      // Update selected area
      const location = place.geometry.location.toJSON();
      setSelectedArea(location);
    },
    [map, searchMarker, infoWindow, locationMode, setLocationMode]
  );

  // Map load handler
  const onLoad = useCallback(
    (mapInstance: google.maps.Map) => {
      setMap(mapInstance);

      // Set map options to allow rotation
      mapInstance.setOptions({
        rotateControl: true,
        tilt: 0, // Start without tilt
      });

      // Apply styles based on initial map type
      if (body !== "earth") {
        const planetaryMapType = createPlanetaryMapType(body, planetaryLayerId);
        mapInstance.mapTypes.set(body, planetaryMapType);
        mapInstance.setOptions({
          clickableIcons: false,
          styles: [],
          backgroundColor: "#050505",
          mapTypeControlOptions: { mapTypeIds: [body] },
          mapId: null,
        });
        mapInstance.setMapTypeId(body);
      } else if (mapType === "roadmap") {
        mapInstance.setOptions({
          styles:
            process.env.NEXT_PUBLIC_GOOGLE_MAPS_ROADMAP_ID !== undefined
              ? null
              : googleMapDarkTheme,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_ROADMAP_ID,
        });
      } else {
        mapInstance.setOptions({
          styles: [],
          mapTypeControlOptions: {
            mapTypeIds: [google.maps.MapTypeId.HYBRID],
          },
          mapId: null,
        });
        mapInstance.setMapTypeId(google.maps.MapTypeId.HYBRID);
      }

      // Set up grid and event handlers
      drawGrid(mapInstance);
      setupMapEventHandlers(mapInstance);

      // Intercept POI click event to prevent default InfoWindow display
      mapInstance.addListener("click", (e: google.maps.MapMouseEvent) => {
        if ((e as any).placeId) {
          // Stop default POI click action
          (e as google.maps.IconMouseEvent).stop();
        }
      });

      // Add heading changed listener
      mapInstance.addListener("heading_changed", () => {
        onHeadingChanged();
      });

      // Add tilt changed listener
      mapInstance.addListener("tilt_changed", () => {
        onTiltChanged();
      });
    },
    [
      drawGrid,
      setupMapEventHandlers,
      mapType,
      onHeadingChanged,
      onTiltChanged,
      body,
      planetaryLayerId,
    ]
  );

  // Map unload handler
  const onUnmount = useCallback(
    (mapInstance: google.maps.Map) => {
      // Clean up grid
      clearAllGridLines();
      removeMapEventHandlers(mapInstance);

      // Clean up search-related objects
      if (searchMarker) {
        searchMarker.setMap(null);
        setSearchMarker(null);
      }

      if (infoWindow) {
        infoWindow.close();
      }

      // Stop location tracking
      stopLocationTracking();

      setMap(null);
    },
    [
      clearAllGridLines,
      removeMapEventHandlers,
      searchMarker,
      infoWindow,
      stopLocationTracking,
    ]
  );

  // Map zoom change handler
  const onZoomChanged = useCallback(() => {
    if (map) {
      const newZoom = map.getZoom();
      if (newZoom) {
        setZoom(newZoom);
        userZoomRef.current = newZoom;
      }
    }
  }, [map]);

  const onIdle = useCallback(() => {
    if (!map) return;

    const nextCenter = map.getCenter();
    const nextZoom = map.getZoom();
    if (!nextCenter || nextZoom === undefined) return;

    setCenter(nextCenter.toJSON());
    setZoom(nextZoom);
    userZoomRef.current = nextZoom;
  }, [map]);

  const activePlanetaryLayer =
    body === "earth" ? null : getPlanetaryLayerConfig(body, planetaryLayerId);

  return {
    // Map state
    isLoaded,
    map,
    center,
    zoom,
    mapType,
    toggleMapType,
    body,
    isEarth,
    selectBody,
    planetaryLayerId,
    planetaryLayers:
      body === "earth" ? [] : PLANETARY_BODY_CONFIGS[body].layers,
    selectPlanetaryLayer,
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

    // Search state
    searchedPlace,
    handlePlaceSelect,

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
    onIdle,
  };
};
