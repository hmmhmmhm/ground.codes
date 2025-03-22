import { useCallback, useEffect, useRef, useState } from "react";
import { Coordinates, LocationMode } from "../types";
import { useDeviceOrientation } from "./use-device-orientation";

interface UseLocationTrackingProps {
  map: google.maps.Map | null;
  onLocationUpdate: (location: Coordinates) => void;
  isTrackingMode?: boolean; // 방향 추적 모드 여부 (기본값: false)
}

/**
 * 위치 추적 관련 기능을 제공하는 커스텀 훅
 * 위치 모드(OFF, LOCATE, TRACKING)에 따라 다른 동작을 수행
 */
export const useLocationTracking = ({
  map,
  onLocationUpdate,
  isTrackingMode = false,
}: UseLocationTrackingProps) => {
  // 현재 위치 모드 상태
  const [locationMode, setLocationMode] = useState<LocationMode>(
    LocationMode.OFF
  );

  // 위치 정보 로드 여부
  const [locationLoaded, setLocationLoaded] = useState(false);

  // 로딩 상태를 ref로 관리하여 렌더링 사이클 문제 방지
  const isLoadingLocationRef = useRef(false);

  // 로딩 상태 getter 함수
  const getIsLoadingLocation = useCallback(
    () => isLoadingLocationRef.current,
    []
  );

  // 로딩 상태 setter 함수
  const setIsLoadingLocationRef = useCallback((loading: boolean) => {
    isLoadingLocationRef.current = loading;
  }, []);

  // 위치 추적 ID 참조
  const watchPositionIdRef = useRef<number | null>(null);

  // 이전 위치 정보 참조
  const prevLocationRef = useRef<Coordinates | null>(null);

  // 사용자 줌 레벨 참조
  const userZoomRef = useRef<number>(15);

  // LOCATE 모드 초기화 여부 참조
  const locateInitializedRef = useRef(false);

  // 오류 플래그 참조
  const errorRef = useRef<string | null>(null);

  // 디바이스 방향 정보 사용
  const {
    heading: deviceHeading,
    requestPermission: requestOrientationPermission,
  } = useDeviceOrientation();

  // 디바이스 방향 정보 요청 완료 여부
  const [orientationPermissionRequested, setOrientationPermissionRequested] =
    useState(false);

  /**
   * 위치 추적 시작 함수
   * 현재 위치 모드에 따라 다른 동작 수행
   */
  const startLocationTracking = useCallback(() => {
    // 현재 위치 모드 확인
    const currentLocationMode = locationMode;

    // OFF 모드에서는 위치 추적을 시작하지 않음
    if (currentLocationMode === LocationMode.OFF) {
      return;
    }

    // 이미 위치 추적 중인 경우 중지 후 재시작
    if (watchPositionIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchPositionIdRef.current);
      watchPositionIdRef.current = null;
    }

    if (navigator.geolocation) {
      // 로딩 상태 설정 (ref 직접 업데이트)
      isLoadingLocationRef.current = true;

      // 디바이스 방향 정보 권한 요청 (아직 요청하지 않은 경우)
      if (!orientationPermissionRequested) {
        requestOrientationPermission().then(() => {
          setOrientationPermissionRequested(true);
        });
      }

      if (currentLocationMode === LocationMode.LOCATE) {
        // LOCATE 모드: 위치를 한 번만 확인
        navigator.geolocation.getCurrentPosition(
          (position) => {
            // 로딩 상태 해제 (ref 직접 업데이트)
            isLoadingLocationRef.current = false;

            const newLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy,
              heading: position.coords.heading,
            };

            // 내 위치 보기 모드: heading 정보 제외하고 위치만 업데이트
            const locationWithoutHeading = {
              lat: newLocation.lat,
              lng: newLocation.lng,
              accuracy: newLocation.accuracy,
            };

            // LOCATE 모드에서 최초 한 번만 지도 중앙 이동
            if (map && !locateInitializedRef.current) {
              // 사용자 zoom 유지
              const currentZoom = map.getZoom() || userZoomRef.current;
              map.setZoom(currentZoom);
              map.panTo(newLocation);

              // LOCATE 모드 초기화 완료 표시
              locateInitializedRef.current = true;
            }

            // 위치 정보 업데이트
            onLocationUpdate(locationWithoutHeading);
            setLocationLoaded(true);
            prevLocationRef.current = newLocation;
          },
          (error) => {
            // 오류 발생 시 로딩 상태 해제 (ref 직접 업데이트)
            isLoadingLocationRef.current = false;

            // 권한 거부 오류 시 위치 모드를 OFF로 변경 (useEffect에서 처리)
            if (error.code === 1) {
              // PERMISSION_DENIED
              errorRef.current = "PERMISSION_DENIED";
            }
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
          }
        );
      } else if (currentLocationMode === LocationMode.TRACKING) {
        // TRACKING 모드: 위치 추적 시작
        const watchId = navigator.geolocation.watchPosition(
          (position) => {
            // 로딩 상태 해제 (ref 직접 업데이트)
            isLoadingLocationRef.current = false;

            // 방향 정보 포함하여 위치 정보 생성
            const newLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy,
              // 디바이스 방향 정보 우선 사용, 없으면 GPS 방향 정보 사용, 둘 다 없으면 이전 방향 정보 유지
              heading:
                deviceHeading !== null
                  ? deviceHeading
                  : position.coords.heading !== null &&
                      position.coords.heading !== undefined
                    ? position.coords.heading
                    : prevLocationRef.current?.heading,
            };

            // 추적 모드: 지도 중앙 이동
            if (map) {
              // 현재 위치 모드 다시 확인 (최신 상태 참조)
              if (locationMode === LocationMode.TRACKING) {
                // 사용자 zoom 유지
                const currentZoom = map.getZoom() || userZoomRef.current;
                map.setZoom(currentZoom);
                map.panTo(newLocation);
              }
            }

            // 위치 정보 업데이트 (heading 정보 포함)
            onLocationUpdate(newLocation);
            setLocationLoaded(true);
            prevLocationRef.current = newLocation;
          },
          (error) => {
            // 로딩 상태 해제 (ref 직접 업데이트)
            isLoadingLocationRef.current = false;
            console.error("위치 추적 오류:", error);
          },
          {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 5000,
          }
        );

        // watchPosition ID 저장
        watchPositionIdRef.current = watchId;
      }
    }
  }, [
    locationMode,
    map,
    onLocationUpdate,
    deviceHeading,
    orientationPermissionRequested,
    requestOrientationPermission,
  ]);

  /**
   * 위치 추적 중지 함수
   */
  const stopLocationTracking = useCallback(() => {
    if (watchPositionIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchPositionIdRef.current);
      watchPositionIdRef.current = null;
    }

    // 로딩 상태 해제
    isLoadingLocationRef.current = false;
  }, [locationMode]);

  /**
   * 위치 모드 토글 함수
   * OFF -> LOCATE -> TRACKING -> OFF 순으로 변경
   */
  const toggleLocationMode = useCallback(() => {
    switch (locationMode) {
      case LocationMode.OFF:
        setLocationModeDirectly(LocationMode.LOCATE);
        break;
      case LocationMode.LOCATE:
        setLocationModeDirectly(LocationMode.TRACKING);
        break;
      case LocationMode.TRACKING:
        setLocationModeDirectly(LocationMode.OFF);
        break;
      default:
        setLocationModeDirectly(LocationMode.OFF);
        break;
    }
  }, [locationMode]);

  /**
   * 위치 모드 직접 설정 함수
   */
  const setLocationModeDirectly = useCallback(
    (mode: LocationMode) => {
      setLocationMode(mode);
    },
    [locationMode]
  );

  /**
   * 위치 모드 변경 시 추적 상태 업데이트
   */
  useEffect(() => {
    const currentLocationMode = locationMode;

    if (currentLocationMode === LocationMode.OFF) {
      // OFF 모드: 위치 추적 중지
      stopLocationTracking();

      // 이전 위치 참조 초기화
      prevLocationRef.current = null;

      // LOCATE 모드 초기화 상태 리셋
      locateInitializedRef.current = false;
    } else if (currentLocationMode === LocationMode.LOCATE) {
      // TRACKING 모드에서 실행 중인 watchPosition이 있으면 중지
      stopLocationTracking();

      // LOCATE 모드: 위치 추적 시작
      startLocationTracking();
    } else if (currentLocationMode === LocationMode.TRACKING) {
      // LOCATE 모드 초기화 상태 리셋
      locateInitializedRef.current = false;

      // TRACKING 모드: 위치 추적 시작
      startLocationTracking();
    }

    // 오류 플래그 확인
    if (errorRef.current === "PERMISSION_DENIED") {
      // 권한 거부 오류 시 위치 모드를 OFF로 변경
      setLocationMode(LocationMode.OFF);
      errorRef.current = null;
    }
  }, [locationMode, startLocationTracking, stopLocationTracking]);

  /**
   * 컴포넌트 언마운트 시 위치 추적 중지
   */
  useEffect(() => {
    return () => {
      if (watchPositionIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchPositionIdRef.current);
        watchPositionIdRef.current = null;
      }
    };
  }, []);

  /**
   * 맵 객체가 변경될 때 사용자 줌 레벨 저장
   */
  useEffect(() => {
    if (map) {
      const zoom = map.getZoom();
      if (zoom) {
        userZoomRef.current = zoom;
      }
    }
  }, [map]);

  return {
    locationMode,
    setLocationMode: setLocationModeDirectly,
    toggleLocationMode,
    userLocation: prevLocationRef.current,
    isLocationLoaded: locationLoaded,
    isLoadingLocation: getIsLoadingLocation(),
    startLocationTracking,
    stopLocationTracking,
    isTrackingLocation: locationMode === LocationMode.TRACKING,
    // 위치 정보 업데이트 로직 개선
    updateLocation: (newLocation: Coordinates) => {
      onLocationUpdate(newLocation);
      setLocationLoaded(true);
      prevLocationRef.current = newLocation;
    },
  };
};
