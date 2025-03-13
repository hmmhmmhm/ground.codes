import React from "react";
import { Marker } from "@react-google-maps/api";

interface MapMarkersProps {
  userLocation: { lat: number; lng: number } | null;
  selectedArea: { lat: number; lng: number } | null;
}

const MapMarkers: React.FC<MapMarkersProps> = ({
  userLocation,
  selectedArea,
}) => {
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
        />
      )}

      {selectedArea &&
        userLocation?.lat !== selectedArea.lat &&
        userLocation?.lng !== selectedArea.lng && (
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
          />
        )}
    </>
  );
};

export default MapMarkers;
