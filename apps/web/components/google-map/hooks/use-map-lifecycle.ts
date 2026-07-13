import {
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
  useCallback,
  useEffect,
} from "react";
import { googleMapDarkTheme } from "@/lib/map/google-map-theme";
import {
  type CelestialBody,
  createPlanetaryMapType,
} from "@/lib/map/celestial-bodies";
import type { Coordinates } from "../types";
import type { EarthMapType } from "./map-container-initial-state";

type UseMapLifecycleOptions = {
  body: CelestialBody;
  cleanupSearch: () => void;
  clearAllGridLines: () => void;
  drawGrid: (map: google.maps.Map) => void;
  encodeSelectedAreaCoordinates: () => void;
  handleMapInteraction: () => void;
  hasGoogleMapsApiKey: boolean;
  isEarth: boolean;
  isGoogleMapsLoaded: boolean;
  map: google.maps.Map | null;
  mapType: EarthMapType;
  onHeadingChanged: () => void;
  onTiltChanged: () => void;
  planetaryLayerId: string;
  removeMapEventHandlers: (map: google.maps.Map) => void;
  selectedArea: Coordinates | null;
  setMap: Dispatch<SetStateAction<google.maps.Map | null>>;
  setSelectedAreaAddress: Dispatch<SetStateAction<string | null>>;
  setZoom: Dispatch<SetStateAction<number>>;
  setupMapEventHandlers: (map: google.maps.Map) => void;
  showGrid: boolean;
  stopLocationTracking: () => void;
  userZoomRef: MutableRefObject<number>;
};

export const useMapLifecycle = ({
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
}: UseMapLifecycleOptions) => {
  useEffect(() => {
    if (!map) return;
    removeMapEventHandlers(map);
    setupMapEventHandlers(map);
    if (showGrid) drawGrid(map);
    else clearAllGridLines();

    map.addListener("dragstart", handleMapInteraction);
    map.addListener("heading_changed", onHeadingChanged);
    map.addListener("tilt_changed", onTiltChanged);
    return () => {
      google.maps.event.clearListeners(map, "dragstart");
      google.maps.event.clearListeners(map, "heading_changed");
      google.maps.event.clearListeners(map, "tilt_changed");
    };
  }, [
    clearAllGridLines,
    drawGrid,
    handleMapInteraction,
    map,
    onHeadingChanged,
    onTiltChanged,
    removeMapEventHandlers,
    selectedArea,
    setupMapEventHandlers,
    showGrid,
  ]);

  useEffect(() => {
    if (selectedArea) encodeSelectedAreaCoordinates();
  }, [encodeSelectedAreaCoordinates, selectedArea]);

  useEffect(() => {
    if (!selectedArea) {
      setSelectedAreaAddress(null);
      return;
    }
    if (
      !isEarth ||
      !hasGoogleMapsApiKey ||
      !isGoogleMapsLoaded ||
      typeof google === "undefined" ||
      !google.maps?.Geocoder
    ) {
      setSelectedAreaAddress(null);
      return;
    }

    let isActive = true;
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: selectedArea }, (results, status) => {
      if (!isActive) return;
      if (status !== google.maps.GeocoderStatus.OK || !results?.length) {
        setSelectedAreaAddress(null);
        return;
      }
      setSelectedAreaAddress(results[0]?.formatted_address ?? null);
    });
    return () => {
      isActive = false;
    };
  }, [
    hasGoogleMapsApiKey,
    isEarth,
    isGoogleMapsLoaded,
    selectedArea,
    setSelectedAreaAddress,
  ]);

  const onLoad = useCallback(
    (mapInstance: google.maps.Map) => {
      setMap(mapInstance);
      mapInstance.setOptions({ rotateControl: true, tilt: 0 });
      if (body !== "earth") {
        const planetaryMapType = createPlanetaryMapType(body, planetaryLayerId);
        mapInstance.mapTypes.set(body, planetaryMapType);
        mapInstance.setOptions({
          clickableIcons: false,
          styles: [],
          backgroundColor: "#050505",
          mapTypeControlOptions: { mapTypeIds: [body] },
        });
        mapInstance.setMapTypeId(body);
      } else if (mapType === "roadmap") {
        mapInstance.setOptions({
          styles: googleMapDarkTheme,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
        });
      } else {
        mapInstance.setOptions({
          styles: [],
          mapTypeControlOptions: {
            mapTypeIds: [google.maps.MapTypeId.HYBRID],
          },
        });
        mapInstance.setMapTypeId(google.maps.MapTypeId.HYBRID);
      }

      drawGrid(mapInstance);
      setupMapEventHandlers(mapInstance);
      mapInstance.addListener("click", (event: google.maps.MapMouseEvent) => {
        if ((event as google.maps.IconMouseEvent).placeId) {
          (event as google.maps.IconMouseEvent).stop();
        }
      });
      mapInstance.addListener("heading_changed", onHeadingChanged);
      mapInstance.addListener("tilt_changed", onTiltChanged);
    },
    [
      body,
      drawGrid,
      mapType,
      onHeadingChanged,
      onTiltChanged,
      planetaryLayerId,
      setMap,
      setupMapEventHandlers,
    ],
  );

  const onUnmount = useCallback(
    (mapInstance: google.maps.Map) => {
      clearAllGridLines();
      removeMapEventHandlers(mapInstance);
      cleanupSearch();
      stopLocationTracking();
      setMap(null);
    },
    [
      cleanupSearch,
      clearAllGridLines,
      removeMapEventHandlers,
      setMap,
      stopLocationTracking,
    ],
  );

  const onZoomChanged = useCallback(() => {
    const newZoom = map?.getZoom();
    if (newZoom) {
      setZoom(newZoom);
      userZoomRef.current = newZoom;
    }
  }, [map, setZoom, userZoomRef]);

  return { onLoad, onUnmount, onZoomChanged };
};
