import React from "react";
import { GoogleMap } from "@react-google-maps/api";
import { useMapContainer } from "./hooks/use-map-container";
import MapMarkers from "./map-markers";
import MapControls from "./map-controls";
import CoordinatesDisplay from "./coordinates-display";

const containerStyle = {
  width: "100%",
  height: "100%",
};

const MapLoader: React.FC = () => {
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
};

export default MapLoader;
