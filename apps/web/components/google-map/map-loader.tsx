import React from "react";
import { GoogleMap } from "@react-google-maps/api";
import { useMapContainer } from "./hooks/use-map-container";
import MapMarkers from "./map-markers";
import MapControls from "./map-controls";

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
    encodedCoordinates,
    isEncoding,
    mapType,
    toggleMapType,
    isFullscreen,
    toggleFullscreen,
  } = useMapContainer();

  return isLoaded ? (
    <div className="relative w-full h-full map-container">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={18}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={onMapClick}
      >
        <MapMarkers 
          userLocation={userLocation} 
          selectedArea={selectedArea} 
          encodedCoordinates={encodedCoordinates}
          isEncoding={isEncoding}
        />
      </GoogleMap>

      <MapControls
        showGrid={showGrid}
        toggleGrid={toggleGrid}
        getUserLocation={getUserLocation}
        mapType={mapType}
        toggleMapType={toggleMapType}
        isFullscreen={isFullscreen}
        toggleFullscreen={toggleFullscreen}
      />
    </div>
  ) : (
    <div>Loading...</div>
  );
};

export default MapLoader;
