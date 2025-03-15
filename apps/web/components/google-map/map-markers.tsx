import React, { useEffect, useState } from "react";
import { Marker, InfoWindow } from "@react-google-maps/api";
import { useI18n } from "@/lib/i18n/i18n-context";

interface MapMarkersProps {
  userLocation: { lat: number; lng: number } | null;
  selectedArea: { lat: number; lng: number } | null;
  zoom?: number;
  encodedCoordinates: string;
  isEncoding: boolean;
}

// Custom styles for the InfoWindow content
const infoWindowContentStyle = {
  padding: "4px",
  maxWidth: "200px",
  position: "relative" as const,
};

// Custom close button styles
const closeButtonStyle = {
  position: "absolute" as const,
  top: "0px",
  right: "0px",
  width: "20px",
  height: "20px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "transparent",
  border: "none",
  cursor: "pointer",
  fontSize: "16px",
  fontWeight: "bold" as const,
  color: "#666",
  padding: "0",
  margin: "0",
  lineHeight: "1",
};

const MapMarkers: React.FC<MapMarkersProps> = ({
  userLocation,
  selectedArea,
  zoom,
  encodedCoordinates,
  isEncoding,
}) => {
  const { t, locale } = useI18n();
  const [showInfoWindow, setShowInfoWindow] = useState(true);

  // Determine if selected area marker should be shown based on grid visibility
  const shouldShowSelectedAreaMarker =
    selectedArea &&
    userLocation?.lat !== selectedArea.lat &&
    userLocation?.lng !== selectedArea.lng;

  // Determine which marker to show the info window on
  const infoWindowPosition = shouldShowSelectedAreaMarker
    ? selectedArea
    : userLocation;

  // Close info window when coordinates change (to prevent stale data)
  useEffect(() => {
    setShowInfoWindow(true);
  }, [encodedCoordinates]);

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

      {infoWindowPosition && showInfoWindow && (
        <InfoWindow
          position={infoWindowPosition}
          onCloseClick={() => setShowInfoWindow(false)}
          options={{
            pixelOffset: new google.maps.Size(0, -5),
            disableAutoPan: false,
            maxWidth: 200,
            minWidth: 150,
          }}
        >
          <div style={infoWindowContentStyle}>
            <button 
              style={closeButtonStyle} 
              onClick={() => setShowInfoWindow(false)}
              aria-label="Close"
            >
              ×
            </button>
            <div style={{ fontWeight: "bold", marginBottom: "4px", paddingRight: "20px" }}>
              {t("map.groundCode")}:
            </div>
            {isEncoding ? (
              <div style={{ color: "#888" }}>{t("map.encoding")}...</div>
            ) : (
              <div style={{ wordBreak: "break-word" }}>
                {encodedCoordinates}
              </div>
            )}
          </div>
        </InfoWindow>
      )}
    </>
  );
};

export default MapMarkers;
