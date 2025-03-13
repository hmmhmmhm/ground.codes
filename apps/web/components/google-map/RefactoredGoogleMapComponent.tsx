import React from "react";
import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";
import { useLanguage } from "./hooks/use-language";
import { useMapContainer } from "./hooks/use-map-container";
import MapMarkers from "./map-markers";
import MapControls from "./map-controls";
import CoordinatesDisplay from "./coordinates-display";

const containerStyle = {
  width: "100%",
  height: "100%",
};

function GoogleMapComponent() {
  const { getUserLanguage } = useLanguage();
  
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    language: getUserLanguage(),
  });

  const {
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
        <MapMarkers 
          userLocation={userLocation} 
          selectedArea={selectedArea} 
        />
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
