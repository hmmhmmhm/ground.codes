import React, { useEffect, useState, useCallback } from "react";
import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";
import { googleMapDarkTheme } from "@/lib/map/google-map-theme";
import { useGridSystem } from "@/lib/map/grid-system";
import MapControls from "./map-controls";
import MapMarkers from "./map-markers";
import CoordinatesDisplay from "./coordinates-display";
import { useMapCoordinates } from "./hooks/use-map-coordinates";
import { useGeolocation } from "./hooks/use-geolocation";

const containerStyle = {
  width: "100%",
  height: "100%",
};

const defaultCenter = {
  lat: 37.5665,
  lng: 126.978,
};

function GoogleMapComponent() {
  const getUserLanguage = () => {
    if (typeof window !== "undefined") {
      return window.navigator.language || "en";
    }
    return "en";
  };

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    language: getUserLanguage(),
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [center, setCenter] = useState(defaultCenter);
  const [userLocationLoaded, setUserLocationLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [selectedArea, setSelectedArea] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const {
    userLocation: geoLocation,
    userLocationLoaded: geoLocationLoaded,
    getUserLocation,
  } = useGeolocation(map, setCenter, setSelectedArea, {
    autoGetLocation: true,
  });

  useEffect(() => {
    if (geoLocation) {
      setUserLocation(geoLocation);
    }
    setUserLocationLoaded(geoLocationLoaded);
  }, [geoLocation, geoLocationLoaded]);

  const {
    encodedCoordinatesEN,
    encodedCoordinatesKR,
    isEncodingEN,
    isEncodingKR,
    encodeSelectedAreaCoordinates,
  } = useMapCoordinates(selectedArea);

  const {
    drawGrid,
    clearAllGridLines,
    setupMapEventHandlers,
    removeMapEventHandlers,
    handleGridCellClick,
  } = useGridSystem(showGrid, selectedArea, setSelectedArea);

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

  useEffect(() => {
    if (selectedArea) {
      encodeSelectedAreaCoordinates();
    }
  }, [selectedArea, encodeSelectedAreaCoordinates]);

  const onLoad = useCallback(
    (mapInstance: google.maps.Map) => {
      console.log("Map loaded");
      mapInstance.setOptions({ styles: googleMapDarkTheme });

      if (userLocationLoaded && userLocation) {
        mapInstance.panTo(userLocation);
        mapInstance.setZoom(18);
      }

      setMap(mapInstance);
    },
    [userLocation, userLocationLoaded]
  );

  const onUnmount = useCallback(
    (mapInstance: google.maps.Map) => {
      console.log("Map unmounting");
      clearAllGridLines();
      removeMapEventHandlers(mapInstance);
      setMap(null);
    },
    [clearAllGridLines, removeMapEventHandlers]
  );

  const onMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      console.log("Map click in component:", e.latLng?.toString());
      handleGridCellClick(e);
    },
    [handleGridCellClick]
  );

  return isLoaded ? (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={18}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={onMapClick}
      >
        <MapMarkers userLocation={userLocation} selectedArea={selectedArea} />
      </GoogleMap>

      <MapControls
        showGrid={showGrid}
        toggleGrid={toggleGrid}
        getUserLocation={getUserLocation}
      />

      {selectedArea && (
        <CoordinatesDisplay
          encodedCoordinatesEN={encodedCoordinatesEN}
          encodedCoordinatesKR={encodedCoordinatesKR}
          isEncodingEN={isEncodingEN}
          isEncodingKR={isEncodingKR}
        />
      )}
    </div>
  ) : (
    <div>Loading...</div>
  );
}

export default React.memo(GoogleMapComponent);
