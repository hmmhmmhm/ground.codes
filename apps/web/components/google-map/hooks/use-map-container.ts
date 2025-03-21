import { useState, useCallback, useEffect, useRef } from "react";
import { useGridSystem } from "@/lib/grid-system";
import { useMapCoordinates } from "./use-map-coordinates";
import { useGeolocation } from "./use-geolocation";
import { googleMapDarkTheme } from "@/lib/map/google-map-theme";
import { useJsApiLoader } from "@react-google-maps/api";
import { useLanguage } from "./use-language";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useLocationTracking } from "./use-location-tracking";
import { Coordinates, LocationMode } from "../types";

const defaultCenter = {
  lat: 37.5665,
  lng: 126.978,
};

// Define libraries array as a constant to prevent recreation on each render
const libraries: "places"[] = ["places"];

// Get map type from cookie
const getMapTypeFromCookie = (): string => {
  try {
    if (typeof window === "undefined") return "roadmap";

    const cookieMapTypeMatch = document.cookie
      .split("; ")
      .find((row) => row.startsWith("MAP_TYPE="));

    const cookieMapType = cookieMapTypeMatch
      ? cookieMapTypeMatch.split("=")[1]
      : undefined;

    if (
      cookieMapType &&
      (cookieMapType === "roadmap" || cookieMapType === "satellite")
    ) {
      return cookieMapType;
    }

    return "roadmap";
  } catch (error) {
    console.error("Error getting map type from cookie:", error);
    return "roadmap";
  }
};

export const useMapContainer = () => {
  const { getUserLanguage } = useLanguage();
  const { isChangingLanguage } = useI18n();

  // Get language from cookie for Google Maps API
  // Google Maps API uses standard language codes:
  // - English: 'en'
  // - Korean: 'ko'
  // - Chinese: 'zh-CN' (not 'cn')
  const mapLanguage = isChangingLanguage ? "en" : getUserLanguage();

  // Load Google Maps API
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    language: mapLanguage, // Language code for Google Maps API
    libraries, // Use the constant libraries array
  });

  // Map state
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [center, setCenter] = useState(defaultCenter);
  const [mapType, setMapType] = useState<string>(getMapTypeFromCookie());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(18);
  const userZoomRef = useRef<number>(18); // 사용자가 설정한 zoom 값을 저장할 ref

  // User location state
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [userLocationLoaded, setUserLocationLoaded] = useState(false);
  const prevLocationRef = useRef<Coordinates | null>(null);

  // Place Details UI state
  const [placeDetailsVisible, setPlaceDetailsVisible] = useState(false);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] =
    useState<google.maps.LatLng | null>(null);

  // Loading state
  const [isLoading, setIsLoading] = useState(false);

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

  // Show info window state
  const [showInfoWindow, setShowInfoWindow] = useState(false);

  // 위치 추적 관련 기능 사용
  const {
    locationMode,
    setLocationMode,
    isLoadingLocation,
    isTrackingLocation,
    startLocationTracking,
    stopLocationTracking,
    toggleLocationMode,
  } = useLocationTracking({
    map,
    isTrackingMode: true,
    onLocationUpdate: useCallback((location) => {
      if (location) {
        console.log(
          "Map container updating location with heading:",
          location.heading
        );

        // 명시적으로 heading 정보를 포함하여 상태 업데이트
        setUserLocation({
          lat: location.lat,
          lng: location.lng,
          accuracy: location.accuracy,
          heading: location.heading,
        });

        setUserLocationLoaded(true);
      }
    }, []),
  });

  // 로딩 상태 동기화 - 의존성 배열 비우기
  useEffect(() => {
    // 함수 내부에서 최신 isLoadingLocation 값을 직접 참조
    if (isLoadingLocation !== undefined) {
      setIsLoading(isLoadingLocation);
    }
    // 빈 의존성 배열로 컴포넌트 마운트 시 한 번만 실행되도록 함
  }, []);

  // Get user location using the hook
  const {
    userLocation: geoLocation,
    getUserLocation: getGeoLocation,
    cancelGeolocationRequest,
    requestOrientationPermission,
  } = useGeolocation(map, setCenter, setSelectedArea, {
    autoGetLocation: true, // 자동으로 위치를 가져오도록 변경
    initialFetch: true, // 최초 위치 정보 가져오기 모드로 설정
  });

  // 위치 추적 시작 함수
  const startWatchingPosition = useCallback(() => {
    startLocationTracking();
  }, [startLocationTracking]);

  // 위치 추적 중지 함수
  const stopWatchingPosition = useCallback(() => {
    stopLocationTracking();
  }, [stopLocationTracking]);

  // 위치 모드 변경 시 추적 상태 업데이트
  useEffect(() => {
    // 위치 모드에 따라 다른 동작 수행
    if (locationMode === LocationMode.OFF) {
      // OFF 모드: 위치 추적 중지
      stopWatchingPosition();

      // 위치 요청 취소 및 로딩 상태 초기화
      cancelGeolocationRequest();

      // 이전 위치 참조 초기화하여 다시 위치 모드 활성화 시 처음부터 시작하도록 함
      prevLocationRef.current = null;
    } else if (locationMode === LocationMode.LOCATE) {
      // LOCATE 모드: 위치를 한 번만 확인
      // 이미 위치 정보가 있는지 확인
      if (!userLocationLoaded) {
        // 위치 정보가 없는 경우에만 getCurrentPosition 실행
        getGeoLocation();
      }
    } else if (locationMode === LocationMode.TRACKING) {
      // TRACKING 모드: 위치 추적 시작
      // 이미 위치 정보가 있는지 확인
      if (!userLocationLoaded || !userLocation) {
        // 위치 정보가 없으면 먼저 가져오기
        getGeoLocation();
      }

      // 위치 추적 시작 (watchPosition)
      startWatchingPosition();
    }
  }, [
    locationMode,
    startWatchingPosition,
    stopWatchingPosition,
    cancelGeolocationRequest,
    userLocationLoaded,
    userLocation,
    getGeoLocation,
  ]);

  // Toggle map type between roadmap and satellite
  const toggleMapType = useCallback(() => {
    const newType = mapType === "roadmap" ? "satellite" : "roadmap";

    // 사용자에게 새로고침 경고 표시
    const confirmMessage =
      "지도 유형을 변경하면 페이지가 새로고침됩니다. 계속하시겠습니까?";
    const userConfirmed = window.confirm(confirmMessage);

    if (!userConfirmed) return;

    try {
      // 쿠키에 맵 타입 저장 (1년 유효)
      document.cookie = `MAP_TYPE=${newType};path=/;max-age=31536000`;

      // 약간의 지연 후 페이지 새로고침
      setTimeout(() => {
        window.location.reload();
      }, 10);
    } catch (error) {
      console.error("Failed to change map type:", error);
    }
  }, [mapType]);

  // Apply map styles based on map type when the map is loaded
  useEffect(() => {
    if (map) {
      if (mapType === "roadmap") {
        // Apply dark theme for roadmap view
        map.setOptions({
          styles: googleMapDarkTheme,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_ROADMAP_ID,
        });
      } else {
        // For satellite view, use empty styles array and explicitly set satellite map type
        map.setOptions({
          styles: [],
          mapTypeId: google.maps.MapTypeId.HYBRID, // Use HYBRID instead of SATELLITE to show labels
          mapTypeControlOptions: {
            mapTypeIds: [google.maps.MapTypeId.HYBRID],
          },
          mapId: null,
        });
      }
    }
  }, [map, mapType]);

  // Toggle fullscreen mode
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  // 사용자 위치 가져오기 함수
  const getUserLocation = useCallback(() => {
    // 위치 모드 토글 (OFF -> LOCATE -> TRACKING -> OFF)
    if (locationMode === LocationMode.OFF) {
      setLocationMode(LocationMode.LOCATE);
    } else if (locationMode === LocationMode.LOCATE) {
      setLocationMode(LocationMode.TRACKING);
    } else {
      setLocationMode(LocationMode.OFF);
    }
  }, [locationMode, setLocationMode]);

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

  // Map click handler
  const onMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      // 지도 클릭 시 위치 추적 모드 해제
      if (locationMode === LocationMode.TRACKING) {
        setLocationMode(LocationMode.OFF);
      }

      // Check if a POI was clicked
      if ((e as any).placeId) {
        // Immediately stop the default POI click behavior
        (e as google.maps.IconMouseEvent).stop();

        // A POI was clicked
        setSelectedPlaceId((e as any).placeId);
        setSelectedLocation(e.latLng || null);
        setPlaceDetailsVisible(true);

        // POI 클릭 시 선택된 영역 초기화하여 그리드 셀 인포윈도우가 표시되지 않도록 함
        setSelectedArea(null);

        // Hide any existing info windows
        setShowInfoWindow(false);

        // Prevent grid cell click handling when POI is clicked
        return;
      }
      // Close place details if open
      if (placeDetailsVisible) {
        setPlaceDetailsVisible(false);
        setSelectedPlaceId(null);
        setSelectedLocation(null);
      }

      handleGridCellClick(e);
    },
    [handleGridCellClick, locationMode, placeDetailsVisible, setLocationMode]
  );

  // Close place details
  const closePlaceDetails = useCallback(() => {
    setPlaceDetailsVisible(false);
    setSelectedPlaceId(null);
    setSelectedLocation(null);

    // Place Details가 닫힐 때 InfoWindow를 표시합니다
    setShowInfoWindow(true);
  }, [setShowInfoWindow]);

  // Map zoom change handler
  const onZoomChanged = useCallback(() => {
    if (map) {
      const newZoom = map.getZoom();
      if (newZoom) {
        setZoom(newZoom);
        userZoomRef.current = newZoom;
      }
    }
  }, [map]);

  // 지도 클릭 시 위치 추적 모드 해제
  const handleMapInteraction = useCallback(() => {
    if (locationMode === LocationMode.TRACKING) {
      setLocationMode(LocationMode.OFF);
    }
  }, [locationMode, setLocationMode]);

  // Setup map event handlers when map is ready
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
      map.addListener("dragstart", handleMapInteraction);

      return () => {
        if (map) {
          google.maps.event.clearListeners(map, "dragstart");
        }
      };
    }
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
      if (!place.geometry || !place.geometry.location || !map) return;

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

        // 검색 결과에 대한 InfoWindow는 계속 표시
        // 단, 이 경우에는 그라운드 코드 InfoWindow는 숨김
        setShowInfoWindow(false);

        infoWindow.open(map, searchMarker);
      }

      // Update selected area
      const location = place.geometry.location.toJSON();
      setSelectedArea(location);
    },
    [map, searchMarker, infoWindow, locationMode, setLocationMode]
  );

  // Map load handler
  const onLoad = useCallback(
    (mapInstance: google.maps.Map) => {
      setMap(mapInstance);

      // Apply styles based on initial map type
      if (mapType === "roadmap") {
        mapInstance.setOptions({
          styles: googleMapDarkTheme,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_ROADMAP_ID,
        });
      } else {
        mapInstance.setOptions({
          styles: [],
          mapTypeId: google.maps.MapTypeId.HYBRID, // Use HYBRID instead of SATELLITE to show labels
          mapTypeControlOptions: {
            mapTypeIds: [google.maps.MapTypeId.HYBRID],
          },
          mapId: null,
        });
      }

      // Set up grid and event handlers
      drawGrid(mapInstance);
      setupMapEventHandlers(mapInstance);

      // POI 클릭 이벤트를 가로채서 기본 InfoWindow 표시를 방지
      mapInstance.addListener("click", (e: google.maps.MapMouseEvent) => {
        if ((e as any).placeId) {
          // 기본 POI 클릭 동작 중지
          (e as google.maps.IconMouseEvent).stop();
        }
      });
    },
    [drawGrid, setupMapEventHandlers, mapType]
  );

  // Map unload handler
  const onUnmount = useCallback(
    (mapInstance: google.maps.Map) => {
      // Clean up grid
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

      // 위치 추적 중지
      stopLocationTracking();

      setMap(null);
    },
    [
      clearAllGridLines,
      removeMapEventHandlers,
      searchMarker,
      infoWindow,
      stopLocationTracking,
    ]
  );

  return {
    // Map state
    isLoaded,
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
    isLoading,
    isTrackingLocation: locationMode === LocationMode.TRACKING,
    locationMode,

    // Grid state
    showGrid,
    toggleGrid: () => {
      const newShowGrid = !showGrid;
      setShowGrid(newShowGrid);

      if (map) {
        if (newShowGrid) {
          drawGrid(map);
        } else {
          clearAllGridLines();
        }
      }
    },

    // Selected area state
    selectedArea,

    // Search state
    searchedPlace,
    handlePlaceSelect,

    // Place Details state
    placeDetailsVisible,
    selectedPlaceId,
    selectedLocation,
    closePlaceDetails,

    // Coordinates encoding state
    encodedCoordinates,
    isEncoding,

    // InfoWindow state
    showInfoWindow,
    setShowInfoWindow,

    // Map event handlers
    onLoad,
    onUnmount,
    onMapClick,
    onZoomChanged,
  };
};
