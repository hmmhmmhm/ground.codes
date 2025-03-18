import React, { useEffect, useState } from "react";
import {
  Marker,
  InfoWindow,
  Circle,
  OverlayView,
} from "@react-google-maps/api";
import { useI18n } from "@/lib/i18n/i18n-context";

interface MapMarkersProps {
  userLocation: {
    lat: number;
    lng: number;
    accuracy?: number;
    heading?: number | null;
  } | null;
  selectedArea: { lat: number; lng: number } | null;
  zoom?: number;
  encodedCoordinates: string;
  isEncoding: boolean;
  isTrackingMode?: boolean;
}

const MapMarkers: React.FC<MapMarkersProps> = ({
  userLocation,
  selectedArea,
  zoom,
  encodedCoordinates,
  isEncoding,
  isTrackingMode = false,
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

  // Determine if we should show accuracy circle based on accuracy value
  const shouldShowAccuracyCircle =
    userLocation?.accuracy && userLocation.accuracy > 10;

  // Check if heading information is available
  const hasHeading =
    userLocation?.heading !== undefined && userLocation?.heading !== null;

  // 방향 마커 관련 상태 관리
  const [lastHeading, setLastHeading] = useState<number | null>(null);

  // 방향 정보가 변경될 때 마지막 유효한 방향 정보 저장
  useEffect(() => {
    console.log('Marker userLocation heading:', userLocation?.heading);
    if (userLocation?.heading !== undefined && userLocation?.heading !== null) {
      console.log('Setting lastHeading to:', userLocation.heading);
      setLastHeading(userLocation.heading);
    }
  }, [userLocation?.heading]);

  // 실제 사용할 방향 정보 (현재 방향 또는 마지막 유효한 방향)
  const effectiveHeading = hasHeading ? userLocation?.heading : lastHeading;
  
  // 트래킹 모드에서만 방향 마커 표시
  const showDirectionMarker = isTrackingMode && effectiveHeading !== null && effectiveHeading !== undefined;
  
  // 디버깅: 방향 정보 확인
  console.log('Marker rendering with:', { 
    hasHeading, 
    heading: userLocation?.heading, 
    lastHeading, 
    effectiveHeading, 
    showDirectionMarker,
    isTrackingMode
  });

  return (
    <>
      {userLocation && (
        <>
          <Marker
            position={userLocation}
            icon={{
              path: showDirectionMarker 
                ? google.maps.SymbolPath.FORWARD_CLOSED_ARROW 
                : google.maps.SymbolPath.CIRCLE,
              fillColor: "#4285F4",
              fillOpacity: 1,
              strokeColor: "#FFFFFF",
              strokeWeight: 2,
              scale: shouldShowAccuracyCircle ? 4 : 8,
              rotation: showDirectionMarker ? effectiveHeading || 0 : 0,
            }}
            title={showDirectionMarker 
              ? `My Position (Heading: ${effectiveHeading !== null && effectiveHeading !== undefined ? effectiveHeading.toFixed(2) : 'N/A'}°)` 
              : "My Position"}
            clickable={true}
          />

          {shouldShowAccuracyCircle && userLocation.accuracy && (
            <>
              <Circle
                center={userLocation}
                radius={userLocation.accuracy}
                options={{
                  strokeColor: "#4285F4",
                  strokeOpacity: 0.8,
                  strokeWeight: 2,
                  fillColor: "#4285F4",
                  fillOpacity: 0.01,
                  clickable: false,
                }}
              />

              {/* Accuracy information label - only visible at zoom level 18+ */}
              {typeof zoom === "number" && zoom >= 18 && (
                <OverlayView
                  position={userLocation}
                  mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                  getPixelPositionOffset={(width, height) => ({
                    x: -(width / 2),
                    y: -(height - 30),
                  })}
                >
                  <div className="text-white px-2 py-1 rounded-md text-sm font-medium shadow-md whitespace-nowrap">
                    {t("map.accuracy.label", {
                      accuracy: Math.round(userLocation.accuracy),
                    })}
                  </div>
                </OverlayView>
              )}
            </>
          )}
        </>
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
              className="absolute top-0 right-0 w-5 h-5 flex items-center justify-center bg-transparent border-none cursor-pointer text-base font-bold text-white p-0 m-0 leading-none focus:outline-none focus-visible:outline-none"
              onClick={() => setShowInfoWindow(false)}
              aria-label="Close"
            >
              ×
            </button>
            <div className="font-medium mb-1 pr-5 text-white">
              {t("map.groundCode")}:
            </div>
            {isEncoding ? (
              <div className="font-bold text-white">{t("map.encoding")}...</div>
            ) : (
              <div className="font-bold break-words text-white">
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
