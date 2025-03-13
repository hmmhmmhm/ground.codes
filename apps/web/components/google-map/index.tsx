import React from "react";
import { GoogleMap } from "@react-google-maps/api";
import { useMapContainer } from "./hooks/use-map-container";
import MapMarkers from "./map-markers";
import MapControls from "./map-controls";
import CoordinatesDisplay from "./coordinates-display";

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

function GoogleMapComponent() {
  const {
    isLoaded,
    center,
    onLoad,
    onUnmount,
    onMapClick,
    userLocation,
    selectedArea,
    showGrid,
    toggleGrid,
    getUserLocation,
    encodedCoordinatesEN,
    encodedCoordinatesKR,
    isEncodingEN,
    isEncodingKR,
  } = useMapContainer();

  return isLoaded ? (
    <div className="relative w-full h-full p-safe">
      <GoogleMap
        {...{ center, onLoad, onUnmount, mapContainerStyle }}
        zoom={18}
        onClick={onMapClick}
      >
        <MapMarkers {...{ userLocation, selectedArea }} />
      </GoogleMap>

      <MapControls {...{ showGrid, toggleGrid, getUserLocation }} />

      {selectedArea && (
        <CoordinatesDisplay
          {...{
            encodedCoordinatesEN,
            encodedCoordinatesKR,
            isEncodingEN,
            isEncodingKR,
          }}
        />
      )}
    </div>
  ) : (
    <div>Loading...</div>
  );
}

export default React.memo(GoogleMapComponent);
