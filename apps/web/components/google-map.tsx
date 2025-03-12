import React, { useEffect, useState } from "react";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import { googleMapDarkTheme } from "@/lib/map/google-map-theme";
import { useGridSystem } from "@/lib/map/grid-system";
import { encode } from "@/lib/code/ground-codes";

const containerStyle = {
  width: "100%",
  height: "100%",
};

const defaultCenter = {
  lat: 37.5665,
  lng: 126.978,
};

function GoogleMapComponent() {
  const getUserLanguage = () => {
    if (typeof window !== "undefined") {
      return window.navigator.language || "en";
    }
    return "en";
  };

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    language: getUserLanguage(),
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [center, setCenter] = useState(defaultCenter);
  const [userLocationLoaded, setUserLocationLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [selectedArea, setSelectedArea] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [encodedCoordinatesEN, setEncodedCoordinatesEN] = useState<string>("");
  const [encodedCoordinatesKR, setEncodedCoordinatesKR] = useState<string>("");
  const [isEncodingEN, setIsEncodingEN] = useState(false);
  const [isEncodingKR, setIsEncodingKR] = useState(false);

  const {
    drawGrid,
    clearAllGridLines,
    setupMapEventHandlers,
    removeMapEventHandlers,
    handleGridCellClick,
  } = useGridSystem(showGrid, selectedArea, setSelectedArea);

  const toggleGrid = React.useCallback(() => {
    const newShowGrid = !showGrid;
    setShowGrid(newShowGrid);

    if (map) {
      if (newShowGrid) {
        drawGrid(map);
      } else {
        clearAllGridLines();
      }
    }
  }, [map, showGrid, drawGrid, clearAllGridLines]);

  useEffect(() => {
    if (map) {
      removeMapEventHandlers(map);
      setupMapEventHandlers(map);

      if (!showGrid) {
        clearAllGridLines();
      } else {
        drawGrid(map);
      }
    }
  }, [
    showGrid,
    map,
    setupMapEventHandlers,
    removeMapEventHandlers,
    clearAllGridLines,
    drawGrid,
    selectedArea,
  ]);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newUserLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(newUserLocation);
          setCenter(newUserLocation);
          setUserLocationLoaded(true);
          setSelectedArea(newUserLocation);

          if (map) {
            map.panTo(newUserLocation);
            map.setZoom(18);
          }
        },
        (error) => {
          console.error("Error getting user location:", error);
          setUserLocationLoaded(true);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
      setUserLocationLoaded(true);
    }
  };

  useEffect(() => {
    getUserLocation();
  }, []);

  useEffect(() => {
    if (selectedArea) {
      const encodeCoordinatesEN = async () => {
        try {
          setIsEncodingEN(true);
          const encoded = await encode({
            lat: selectedArea.lat,
            lng: selectedArea.lng,
            language: "English",
          });
          setEncodedCoordinatesEN(encoded);
        } catch (error) {
          console.error("Error encoding coordinates (English):", error);
          setEncodedCoordinatesEN("인코딩 오류");
        } finally {
          setIsEncodingEN(false);
        }
      };

      const encodeCoordinatesKR = async () => {
        try {
          setIsEncodingKR(true);
          const encoded = await encode({
            lat: selectedArea.lat,
            lng: selectedArea.lng,
            language: "Korean",
          });
          setEncodedCoordinatesKR(encoded);
        } catch (error) {
          console.error("Error encoding coordinates (Korean):", error);
          setEncodedCoordinatesKR("인코딩 오류");
        } finally {
          setIsEncodingKR(false);
        }
      };

      encodeCoordinatesEN();
      encodeCoordinatesKR();
    }
  }, [selectedArea]);

  const onLoad = React.useCallback(
    (mapInstance: google.maps.Map) => {
      console.log("Map loaded");
      mapInstance.setOptions({ styles: googleMapDarkTheme });

      if (userLocationLoaded && userLocation) {
        mapInstance.panTo(userLocation);
        mapInstance.setZoom(18);
      }

      // We're not setting up event handlers here anymore
      // They'll be set up in the useEffect
      setMap(mapInstance);
    },
    [userLocation, userLocationLoaded]
  );

  const onUnmount = React.useCallback(
    (mapInstance: google.maps.Map) => {
      console.log("Map unmounting");
      clearAllGridLines();
      removeMapEventHandlers(mapInstance);
      setMap(null);
    },
    [clearAllGridLines, removeMapEventHandlers]
  );

  // Handle map click to select grid cell
  const onMapClick = React.useCallback(
    (e: google.maps.MapMouseEvent) => {
      console.log("Map click in component:", e.latLng?.toString());
      handleGridCellClick(e);
    },
    [handleGridCellClick]
  );

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
      </GoogleMap>

      <button
        onClick={toggleGrid}
        className="absolute bottom-[200px] right-[10px] bg-white border-none rounded-full w-[40px] h-[40px] shadow-md cursor-pointer flex justify-center items-center z-10"
        title="격자 표시 전환"
        aria-label="격자 표시 전환"
        style={{ backgroundColor: showGrid ? "#4285F4" : "#FFFFFF" }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke={showGrid ? "#FFFFFF" : "#1A73E8"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="3" y1="9" x2="21" y2="9"></line>
          <line x1="3" y1="15" x2="21" y2="15"></line>
          <line x1="9" y1="3" x2="9" y2="21"></line>
          <line x1="15" y1="3" x2="15" y2="21"></line>
        </svg>
      </button>

      <button
        onClick={getUserLocation}
        className="absolute bottom-[150px] right-[10px] bg-white border-none rounded-full w-[40px] h-[40px] shadow-md cursor-pointer flex justify-center items-center z-10"
        title="내 위치로 이동"
        aria-label="내 위치로 이동"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#1A73E8"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="4"></circle>
          <path d="M12 2v2"></path>
          <path d="M12 20v2"></path>
          <path d="M2 12h2"></path>
          <path d="M20 12h2"></path>
          <path d="M20 12h2"></path>
        </svg>
      </button>

      {selectedArea && (
        <div className="absolute bottom-[260px] right-[10px] bg-white p-2 rounded shadow-md z-10 text-sm">
          <p className="m-0">
            EN: <b>{isEncodingEN ? "로딩 중..." : encodedCoordinatesEN}</b>
          </p>
          <p className="m-0 mt-1">
            KR: <b>{isEncodingKR ? "로딩 중..." : encodedCoordinatesKR}</b>
          </p>
        </div>
      )}
    </div>
  ) : (
    <div>Loading...</div>
  );
}

export default React.memo(GoogleMapComponent);
