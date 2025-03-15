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

const MapMarkers: React.FC<MapMarkersProps> = ({
  userLocation,
  selectedArea,
  zoom,
  encodedCoordinates,
  isEncoding,
}) => {
  const { t } = useI18n();
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
          <div className="relative p-1 max-w-[200px]">
            <button
              className="absolute top-0 right-0 w-5 h-5 flex items-center justify-center bg-transparent border-none cursor-pointer text-base font-bold text-gray-600 p-0 m-0 leading-none focus:outline-none focus-visible:outline-none"
              onClick={() => setShowInfoWindow(false)}
              aria-label="Close"
            >
              ×
            </button>
            <div className="font-thin mb-1 pr-5">{t("map.groundCode")}:</div>
            {isEncoding ? (
              <div className="font-bold text-gray-500">
                {t("map.encoding")}...
              </div>
            ) : (
              <div className="font-bold break-words">{encodedCoordinates}</div>
            )}
          </div>
        </InfoWindow>
      )}
    </>
  );
};

export default MapMarkers;
