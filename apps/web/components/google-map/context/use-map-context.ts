import { useState, useCallback, useEffect } from "react";
import { useGridSystem } from "@/lib/grid-system";
import { useMapCoordinates } from "../hooks/use-map-coordinates";
import { useGeolocation } from "../hooks/use-geolocation";
import { googleMapDarkTheme } from "@/lib/map/google-map-theme";
import { Coordinates, MapContextType, defaultCenter } from "./types";

export const useMapContextState = (): MapContextType => {
  // Map state
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [center, setCenter] = useState(defaultCenter);

  // User location state
  const [userLocationLoaded, setUserLocationLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);

  // Grid state
  const [showGrid, setShowGrid] = useState(true);

  // Selected area state
  const [selectedArea, setSelectedArea] = useState<Coordinates | null>(null);

  // Get user location using the hook
  const {
    userLocation: geoLocation,
    userLocationLoaded: geoLocationLoaded,
    getUserLocation,
  } = useGeolocation(map, setCenter, setSelectedArea, {
    autoGetLocation: true,
  });

  // Update user location state when geolocation changes
  useEffect(() => {
    if (geoLocation) {
      setUserLocation(geoLocation);
    }
    setUserLocationLoaded(geoLocationLoaded);
  }, [geoLocation, geoLocationLoaded]);

  // Get encoded coordinates using the hook
  const { encodedCoordinates, isEncoding, encodeSelectedAreaCoordinates } =
    useMapCoordinates(selectedArea);

  // Get grid system functions using the hook
  const {
    drawGrid,
    clearAllGridLines,
    setupMapEventHandlers,
    removeMapEventHandlers,
    handleGridCellClick,
  } = useGridSystem(showGrid, selectedArea, setSelectedArea);

  // Toggle grid visibility
  const toggleGrid = useCallback(() => {
    const newShowGrid = !showGrid;
    setShowGrid(newShowGrid);

    if (map) {
      if (newShowGrid) {
        drawGrid(map);
      } else {
        clearAllGridLines();
      }
    }
  }, [map, showGrid, drawGrid, clearAllGridLines]);

  // Update grid when map or showGrid changes
  useEffect(() => {
    if (map) {
      removeMapEventHandlers(map);
      setupMapEventHandlers(map);

      if (!showGrid) {
        clearAllGridLines();
      } else {
        drawGrid(map);
      }
    }
  }, [
    showGrid,
    map,
    setupMapEventHandlers,
    removeMapEventHandlers,
    clearAllGridLines,
    drawGrid,
    selectedArea,
  ]);

  // Encode coordinates when selected area changes
  useEffect(() => {
    if (selectedArea) {
      encodeSelectedAreaCoordinates();
    }
  }, [selectedArea, encodeSelectedAreaCoordinates]);

  // Map unmount handler
  const onUnmount = useCallback(
    (mapInstance: google.maps.Map) => {
      clearAllGridLines();
      removeMapEventHandlers(mapInstance);
      setMap(null);
    },
    [clearAllGridLines, removeMapEventHandlers]
  );

  return {
    map,
    setMap,
    center,
    setCenter,
    userLocation,
    userLocationLoaded,
    getUserLocation,
    showGrid,
    toggleGrid,
    selectedArea,
    setSelectedArea,
    encodedCoordinates,
    isEncoding,
    encodeSelectedAreaCoordinates,
    drawGrid,
    clearAllGridLines,
    setupMapEventHandlers,
    removeMapEventHandlers,
    handleGridCellClick,
    onUnmount,
  };
};
