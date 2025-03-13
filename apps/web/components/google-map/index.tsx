import React from "react";
import { GoogleMap } from "@react-google-maps/api";
import { useMapContainer } from "./hooks/use-map-container";
import MapMarkers from "./map-markers";
import MapControls from "./map-controls";
import CoordinatesDisplay from "./coordinates-display";
import MapSearch from "./map-search";

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

function GoogleMapComponent() {
  const {
    isLoaded,
    center,
    map,
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
    handlePlaceSelect,
  } = useMapContainer();

  return isLoaded ? (
    <div className="relative w-full h-full">
      <GoogleMap
        {...{ center, onLoad, onUnmount, mapContainerStyle }}
        zoom={18}
        onClick={onMapClick}
      >
        <MapMarkers {...{ userLocation, selectedArea }} />
      </GoogleMap>

      <MapSearch map={map} onPlaceSelect={handlePlaceSelect} />
      
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
