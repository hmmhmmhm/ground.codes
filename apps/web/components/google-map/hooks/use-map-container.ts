import { useState, useCallback, useEffect, useRef } from "react";
import { useGridSystem } from "@/lib/grid-system";
import { useMapCoordinates } from "./use-map-coordinates";
import { useGeolocation } from "./use-geolocation";
import { googleMapDarkTheme } from "@/lib/map/google-map-theme";
import { useJsApiLoader } from "@react-google-maps/api";
import { useLanguage } from "./use-language";

interface Coordinates {
  lat: number;
  lng: number;
  heading?: number | null;
}

const defaultCenter = {
  lat: 37.5665,
  lng: 126.978,
};

// 위치 모드 상태를 정의하는 열거형
enum LocationMode {
  OFF = 0,        // 꺼짐
  LOCATE = 1,     // 내 위치 보기
  TRACKING = 2,   // 위치 추적
}

export const useMapContainer = () => {
  const { getUserLanguage } = useLanguage();

  // Load Google Maps API
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    language: getUserLanguage(),
    libraries: ["places"],
  });

  // Map state
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [center, setCenter] = useState(defaultCenter);
  const [mapType, setMapType] = useState<string>("roadmap");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(18);

  // User location state
  const [userLocationLoaded, setUserLocationLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const prevLocationRef = useRef<Coordinates | null>(null);
  
  // Location tracking state
  const [locationMode, setLocationMode] = useState<LocationMode>(LocationMode.OFF);
  const isTrackingLocation = locationMode === LocationMode.TRACKING;

  // Grid state
  const [showGrid, setShowGrid] = useState(true);

  // Selected area state
  const [selectedArea, setSelectedArea] = useState<Coordinates | null>(null);

  // Search result state
  const [searchedPlace, setSearchedPlace] =
    useState<google.maps.places.PlaceResult | null>(null);
  const [searchMarker, setSearchMarker] = useState<google.maps.Marker | null>(
    null
  );
  const [infoWindow, setInfoWindow] = useState<google.maps.InfoWindow | null>(
    null
  );

  // Get user location using the hook
  const {
    userLocation: geoLocation,
    userLocationLoaded: geoLocationLoaded,
    getUserLocation: getGeoLocation,
    isLoading: isLoadingLocation,
    requestOrientationPermission,
  } = useGeolocation(map, setCenter, setSelectedArea, {
    autoGetLocation: true,
  });

  // Enhanced getUserLocation function that also requests device orientation permission
  // and handles location tracking mode
  const getUserLocation = useCallback(() => {
    // 위치 모드를 순환시킴: 꺼짐 -> 내 위치 보기 -> 위치 추적 -> 꺼짐
    setLocationMode((prevMode) => {
      // 현재 꺼짐 상태면 내 위치 보기로 변경
      if (prevMode === LocationMode.OFF) {
        return LocationMode.LOCATE;
      }
      // 현재 내 위치 보기 상태면 위치 추적으로 변경
      else if (prevMode === LocationMode.LOCATE) {
        return LocationMode.TRACKING;
      }
      // 현재 위치 추적 상태면 꺼짐으로 변경
      else {
        return LocationMode.OFF;
      }
    });
    
    // Request device orientation permission for iOS devices
    requestOrientationPermission().catch((error) => {
      console.error("Error requesting device orientation permission:", error);
    });

    // Get geolocation
    getGeoLocation();
  }, [getGeoLocation, requestOrientationPermission]);

  // Check if only the heading has changed
  const isOnlyHeadingChanged = useCallback(
    (prev: Coordinates | null, next: Coordinates | null) => {
      if (!prev || !next) return false;

      return (
        prev.lat === next.lat &&
        prev.lng === next.lng &&
        prev.heading !== next.heading
      );
    },
    []
  );

  // Update user location state when geolocation changes
  useEffect(() => {
    if (geoLocation) {
      const onlyHeadingChanged = isOnlyHeadingChanged(
        prevLocationRef.current,
        geoLocation
      );

      // 위치 모드에 따라 지도 중앙 이동 처리
      if (locationMode === LocationMode.TRACKING) {
        // 추적 모드: 헤딩만 변경된 경우가 아니면 항상 지도 중앙 이동
        if (!onlyHeadingChanged && setCenter) {
          setCenter(geoLocation);
        }
      } else if (locationMode === LocationMode.LOCATE) {
        // 내 위치 보기 모드: 최초 위치 확인 시에만 지도 중앙 이동
        if (!prevLocationRef.current && setCenter) {
          setCenter(geoLocation);
          
          // 내 위치 보기 모드에서는 위치를 한 번 확인한 후 자동으로 OFF 모드로 변경
          setLocationMode(LocationMode.OFF);
        }
      }

      // 위치 정보 업데이트 및 이전 위치 저장
      setUserLocation(geoLocation);
      prevLocationRef.current = geoLocation;
    }
    setUserLocationLoaded(geoLocationLoaded);
  }, [
    geoLocation,
    geoLocationLoaded,
    isOnlyHeadingChanged,
    setCenter,
    setSelectedArea,
    locationMode,
  ]);

  // 지도 클릭 시 위치 추적 모드 해제
  const handleMapInteraction = useCallback(() => {
    if (locationMode === LocationMode.TRACKING) {
      setLocationMode(LocationMode.OFF);
    }
  }, [locationMode]);

  // Get encoded coordinates using the hook
  const { encodedCoordinates, isEncoding, encodeSelectedAreaCoordinates } =
    useMapCoordinates(selectedArea);

  // Get grid system functions using the hook
  const {
    drawGrid,
    clearAllGridLines,
    setupMapEventHandlers,
    removeMapEventHandlers,
    handleGridCellClick,
  } = useGridSystem(showGrid, selectedArea, setSelectedArea);

  // Toggle grid visibility
  const toggleGrid = useCallback(() => {
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

  // Update grid when map or showGrid changes
  useEffect(() => {
    if (map) {
      removeMapEventHandlers(map);
      setupMapEventHandlers(map);

      if (!showGrid) {
        clearAllGridLines();
      } else {
        drawGrid(map);
      }
      
      // 지도 드래그 이벤트 리스너 추가
      map.addListener('dragstart', handleMapInteraction);
    }
    
    return () => {
      if (map) {
        // 지도 드래그 이벤트 리스너 제거
        google.maps.event.clearListeners(map, 'dragstart');
      }
    };
  }, [
    showGrid,
    map,
    setupMapEventHandlers,
    removeMapEventHandlers,
    clearAllGridLines,
    drawGrid,
    selectedArea,
    handleMapInteraction,
  ]);

  // Encode coordinates when selected area changes
  useEffect(() => {
    if (selectedArea) {
      encodeSelectedAreaCoordinates();
    }
  }, [selectedArea, encodeSelectedAreaCoordinates]);

  // Initialize InfoWindow
  useEffect(() => {
    if (isLoaded && !infoWindow) {
      setInfoWindow(new google.maps.InfoWindow());
    }
  }, [isLoaded, infoWindow]);

  // Handle place selection from search
  const handlePlaceSelect = useCallback(
    (place: google.maps.places.PlaceResult) => {
      if (!map || !place.geometry?.location) return;

      // 검색 시 위치 추적 모드 해제
      if (locationMode === LocationMode.TRACKING) {
        setLocationMode(LocationMode.OFF);
      }

      setSearchedPlace(place);

      // Adjust map view based on place geometry
      if (place.geometry.viewport) {
        map.fitBounds(place.geometry.viewport);
      } else {
        map.setCenter(place.geometry.location);
        map.setZoom(17);
      }

      // Create or update marker
      if (!searchMarker) {
        const marker = new google.maps.Marker({
          map,
          position: place.geometry.location,
          animation: google.maps.Animation.DROP,
        });
        setSearchMarker(marker);
      } else {
        searchMarker.setPosition(place.geometry.location);
      }

      // Show info window
      if (infoWindow && searchMarker) {
        const content = `
        <div>
          <strong>${place.name || ""}</strong><br>
          ${place.formatted_address || ""}
        </div>
      `;
        infoWindow.setContent(content);
        infoWindow.open(map, searchMarker);
      }

      // Update selected area
      const location = place.geometry.location.toJSON();
      setSelectedArea(location);
    },
    [map, searchMarker, infoWindow, locationMode]
  );

  // Map load handler
  const onLoad = useCallback(
    (mapInstance: google.maps.Map) => {
      console.log("Map loaded");
      mapInstance.setOptions({
        styles: googleMapDarkTheme,
        mapTypeId: mapType as google.maps.MapTypeId,
        mapTypeControl: false,
        fullscreenControl: false,
      });

      if (userLocationLoaded && userLocation) {
        mapInstance.panTo(userLocation);
        mapInstance.setZoom(zoom);
      }

      setMap(mapInstance);
    },
    [userLocation, userLocationLoaded, mapType, zoom]
  );

  // Map unmount handler
  const onUnmount = useCallback(
    (mapInstance: google.maps.Map) => {
      console.log("Map unmounting");
      clearAllGridLines();
      removeMapEventHandlers(mapInstance);

      // Clean up search-related objects
      if (searchMarker) {
        searchMarker.setMap(null);
        setSearchMarker(null);
      }

      if (infoWindow) {
        infoWindow.close();
      }

      setMap(null);
    },
    [clearAllGridLines, removeMapEventHandlers, searchMarker, infoWindow]
  );

  // Map click handler
  const onMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      console.log("Map click in component:", e.latLng?.toString());
      
      // 지도 클릭 시 위치 추적 모드 해제
      if (locationMode === LocationMode.TRACKING) {
        setLocationMode(LocationMode.OFF);
      }
      
      handleGridCellClick(e);
    },
    [handleGridCellClick, locationMode]
  );

  // Toggle map type between roadmap and satellite
  const toggleMapType = useCallback(() => {
    if (!isLoaded) return;

    const newMapType = mapType === "roadmap" ? "hybrid" : "roadmap";
    setMapType(newMapType);

    if (map) {
      map.setMapTypeId(newMapType as google.maps.MapTypeId);
    }
  }, [map, mapType, isLoaded]);

  // Toggle fullscreen mode
  const toggleFullscreen = useCallback(() => {
    const mapElement = document.querySelector(".map-container");
    if (!mapElement) {
      console.error("Map container element not found");
      return;
    }

    if (!isFullscreen) {
      try {
        if (mapElement.requestFullscreen) {
          mapElement.requestFullscreen();
        } else if ((mapElement as any).webkitRequestFullscreen) {
          (mapElement as any).webkitRequestFullscreen();
        } else if ((mapElement as any).msRequestFullscreen) {
          (mapElement as any).msRequestFullscreen();
        }
      } catch (error) {
        console.error("Failed to enter fullscreen mode:", error);
      }
    } else {
      try {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          (document as any).webkitExitFullscreen();
        } else if ((document as any).msExitFullscreen) {
          (document as any).msExitFullscreen();
        }
      } catch (error) {
        console.error("Failed to exit fullscreen mode:", error);
      }
    }

    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  // Listen for fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "MSFullscreenChange",
        handleFullscreenChange
      );
    };
  }, []);

  return {
    // Loading state
    isLoaded,

    // Map state
    map,
    center,
    zoom,
    mapType,
    toggleMapType,
    isFullscreen,
    toggleFullscreen,

    // User location state
    userLocation,
    userLocationLoaded,
    getUserLocation,
    isLoadingLocation,
    isTrackingLocation,
    locationMode,

    // Grid state
    showGrid,
    toggleGrid,

    // Selected area state
    selectedArea,

    // Search state
    searchedPlace,
    handlePlaceSelect,

    // Coordinates encoding state
    encodedCoordinates,
    isEncoding,

    // Map event handlers
    onLoad,
    onUnmount,
    onMapClick,
  };
};
