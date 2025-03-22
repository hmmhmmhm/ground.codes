import { useState, useCallback, useEffect, useRef } from "react";
import { useDeviceOrientation } from "./use-device-orientation";

interface Location {
  lat: number;
  lng: number;
  accuracy?: number;
  heading?: number | null;
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  autoGetLocation?: boolean;
  initialFetch?: boolean; // 최초 위치 정보 가져오기 여부
}

interface UseGeolocationReturn {
  userLocation: Location | null;
  userLocationLoaded: boolean;
  getUserLocation: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  requestOrientationPermission: () => Promise<boolean>;
  cancelGeolocationRequest: () => void;
}

export const useGeolocation = (
  map: google.maps.Map | null,
  setCenter?: (location: Location) => void,
  setSelectedArea?: (location: Location) => void,
  options: UseGeolocationOptions = {},
  isTrackingMode: boolean = false, // Add isTrackingMode parameter with default false
  onPositionUpdate?: (location: Location) => void
): UseGeolocationReturn => {
  const {
    enableHighAccuracy = true,
    timeout = 5000,
    maximumAge = 0,
    autoGetLocation = true,
    initialFetch = false, // 기본값은 false
  } = options;

  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [userLocationLoaded, setUserLocationLoaded] = useState(false);

  // Loading state ref to avoid render cycles
  const isLoadingRef = useRef(false);

  // Expose loading state through a getter function
  const getIsLoading = useCallback(() => isLoadingRef.current, []);

  // Use a ref to track if this is just a heading update
  const isHeadingUpdateRef = useRef(false);

  // Use the device orientation hook
  const { heading, requestPermission } = useDeviceOrientation();

  // Use a ref to track the previous heading to prevent unnecessary updates
  const prevHeadingRef = useRef<number | null>(null);

  // Update user location when heading changes from device orientation
  useEffect(() => {
    // 방향 정보가 있고 추적 모드일 때만 방향 업데이트
    if (userLocation && heading !== null && isTrackingMode) {
      // 이전 방향과 현재 방향이 같으면 업데이트 건너뛰기
      const prevHeading = prevHeadingRef.current;
      if (prevHeading === heading) {
        return;
      }

      // 방향 변화가 충분히 큰 경우에만 업데이트 (작은 변화는 무시)
      if (prevHeading !== null) {
        const angleDiff = Math.abs(heading - prevHeading);
        const normalizedDiff = angleDiff > 180 ? 360 - angleDiff : angleDiff;
        if (normalizedDiff < 3) {
          return;
        }
      }

      // 방향 업데이트 플래그 설정
      isHeadingUpdateRef.current = true;
      prevHeadingRef.current = heading;

      // 렌더링 사이클 분리를 위해 requestAnimationFrame 사용
      requestAnimationFrame(() => {
        setUserLocation((prev) => {
          if (!prev) return null;
          return { ...prev, heading };
        });
      });
    }
  }, [heading, userLocation, isTrackingMode]);

  // Track current geolocation request ID
  const geolocationRequestIdRef = useRef<number | null>(null);

  // Cancel any ongoing geolocation request
  const cancelGeolocationRequest = useCallback(() => {
    if (geolocationRequestIdRef.current !== null) {
      navigator.geolocation.clearWatch(geolocationRequestIdRef.current);
      geolocationRequestIdRef.current = null;
      isLoadingRef.current = false;
    }
  }, []);

  // Start watching position
  const startWatchingPosition = useCallback(() => {
    if (navigator.geolocation) {
      cancelGeolocationRequest();

      // Update loading ref directly instead of state
      isLoadingRef.current = true;

      // 이전 위치 정보 유지 (방향 정보 포함)
      const prevLocation = userLocation;

      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          // Update loading ref directly
          isLoadingRef.current = false;

          // 새 위치 정보 생성 (이전 방향 정보 유지)
          const newLocation = updateUserLocation(position);

          // 방향 정보 업데이트 플래그 설정
          if (
            position.coords.heading !== null &&
            position.coords.heading !== undefined
          ) {
            isHeadingUpdateRef.current = true;
          }

          // 위치 정보 업데이트
          setUserLocation(newLocation);
        },
        (error) => {
          // Update loading ref directly
          isLoadingRef.current = false;
          // setError(error.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 1000,
        }
      );

      geolocationRequestIdRef.current = watchId;
    }
  }, [cancelGeolocationRequest, userLocation]);

  // 위치 정보 업데이트 함수
  const updateUserLocation = useCallback(
    (position: GeolocationPosition) => {
      // 새 위치 정보 생성
      const newLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        // 방향 정보 처리 (새 방향 정보가 있으면 업데이트, 없으면 이전 방향 정보 유지)
        heading:
          position.coords.heading !== null &&
          position.coords.heading !== undefined
            ? position.coords.heading
            : userLocation?.heading || null,
      };

      // 위치 정보 업데이트
      setUserLocation(newLocation);
      return newLocation;
    },
    [userLocation]
  );

  const getUserLocation = useCallback(() => {
    if (navigator.geolocation) {
      // Cancel any existing request first
      cancelGeolocationRequest();

      // Set loading state (directly update ref)
      isLoadingRef.current = true;

      // Get current position
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // This is a full position update, not just heading
          isHeadingUpdateRef.current = false;

          const newUserLocation = updateUserLocation(position);

          // Batch state updates to prevent re-renders between updates
          const shouldUpdateCenter =
            setCenter &&
            (isTrackingMode || (!isTrackingMode && !userLocationLoaded));

          // Update loading state first
          setUserLocationLoaded(true);
          isLoadingRef.current = false;

          // Update center if needed
          if (shouldUpdateCenter && map) {
            map.panTo({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
          }

          // Call the callback with the new location
          onPositionUpdate?.(newUserLocation);
        },
        (error) => {
          console.error("Error getting user location:", error);
          // setError(error);
          isLoadingRef.current = false;
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );
    }
  }, [
    cancelGeolocationRequest,
    isTrackingMode,
    map,
    onPositionUpdate,
    setCenter,
    updateUserLocation,
    userLocationLoaded,
  ]);

  // Monitor loading state changes
  useEffect(() => {
    // If loading state is set to false, ensure any pending requests are canceled
    if (!getIsLoading() && geolocationRequestIdRef.current !== null) {
      navigator.geolocation.clearWatch(geolocationRequestIdRef.current);
      geolocationRequestIdRef.current = null;
    }
  }, [getIsLoading]);

  useEffect(() => {
    if (autoGetLocation) {
      if (initialFetch) {
        startWatchingPosition();
      } else {
        getUserLocation();
      }
    }

    // Clean up any pending geolocation requests on unmount
    return () => {
      cancelGeolocationRequest();
    };
  }, [
    autoGetLocation,
    getUserLocation,
    startWatchingPosition,
    initialFetch,
    cancelGeolocationRequest,
  ]);

  return {
    userLocation,
    userLocationLoaded,
    getUserLocation,
    isLoading: getIsLoading(),
    setIsLoading: (loading: boolean) => {
      isLoadingRef.current = loading;
    },
    requestOrientationPermission: requestPermission,
    cancelGeolocationRequest,
  };
};
