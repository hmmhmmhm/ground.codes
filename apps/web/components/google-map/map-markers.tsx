import React from "react";
import { Marker } from "@react-google-maps/api";

interface MapMarkersProps {
  userLocation: { lat: number; lng: number } | null;
  selectedArea: { lat: number; lng: number } | null;
  zoom?: number;
}

const MapMarkers: React.FC<MapMarkersProps> = ({
  userLocation,
  selectedArea,
  zoom,
}) => {
  // Determine if selected area marker should be shown based on grid visibility
  const shouldShowSelectedAreaMarker =
    selectedArea &&
    userLocation?.lat !== selectedArea.lat &&
    userLocation?.lng !== selectedArea.lng;

  return (
    <>
      {userLocation && (
        <Marker
          position={userLocation}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: "#4285F4",
            fillOpacity: 1,
            strokeColor: "#FFFFFF",
            strokeWeight: 2,
            scale: 8,
          }}
          title="My Position"
          clickable={false}
        />
      )}

      {shouldShowSelectedAreaMarker && (
        <Marker
          position={selectedArea}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: "#FF5722",
            fillOpacity: 0.7,
            strokeColor: "#FFFFFF",
            strokeWeight: 1,
            scale: 5,
          }}
          title="Selected Area"
          clickable={false}
        />
      )}
    </>
  );
};

export default MapMarkers;
