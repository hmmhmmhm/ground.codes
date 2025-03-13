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
    zoom,
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
    mapType,
    toggleMapType,
    isFullscreen,
    toggleFullscreen,
  } = useMapContainer();

  return isLoaded ? (
    <div className="relative w-full h-full map-container">
      <GoogleMap
        {...{ center, onLoad, onUnmount, mapContainerStyle }}
        zoom={zoom}
        onClick={onMapClick}
      >
        <MapMarkers {...{ userLocation, selectedArea }} zoom={zoom} />
      </GoogleMap>

      <MapSearch map={map} onPlaceSelect={handlePlaceSelect} />

      <MapControls
        {...{
          showGrid,
          toggleGrid,
          getUserLocation,
          mapType,
          toggleMapType,
          isFullscreen,
          toggleFullscreen,
        }}
      />

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
