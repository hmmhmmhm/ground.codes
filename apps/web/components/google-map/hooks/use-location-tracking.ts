import { useCallback, useEffect, useRef, useState } from "react";
import { Coordinates, LocationMode } from "../types";
import { useDeviceOrientation } from "./use-device-orientation";

interface UseLocationTrackingProps {
  map: google.maps.Map | null;
  onLocationUpdate: (location: Coordinates) => void;
}

/**
 * Location tracking related functionality
 * Location mode (OFF, LOCATE, TRACKING) dependent behavior
 */
export const useLocationTracking = ({
  map,
  onLocationUpdate,
}: UseLocationTrackingProps) => {
  // Default value is OFF
  const [locationMode, setLocationMode] = useState<LocationMode>(
    LocationMode.OFF
  );

  // Location information loaded flag
  const [locationLoaded, setLocationLoaded] = useState(false);

  // Loading state management to prevent rendering cycle issues
  const isLoadingLocationRef = useRef(false);

  // Loading state getter function
  const getIsLoadingLocation = useCallback(
    () => isLoadingLocationRef.current,
    []
  );

  // Watch position ID reference
  const watchPositionIdRef = useRef<number | null>(null);

  // Previous location reference
  const prevLocationRef = useRef<Coordinates | null>(null);

  // User zoom level reference
  const userZoomRef = useRef<number>(15);

  // LOCATE mode initialization flag reference
  const locateInitializedRef = useRef(false);

  // Error flag reference
  const errorRef = useRef<string | null>(null);

  // Device orientation information usage
  const {
    heading: deviceHeading,
    requestPermission: requestOrientationPermission,
  } = useDeviceOrientation();

  // Device orientation permission request flag
  const [orientationPermissionRequested, setOrientationPermissionRequested] =
    useState(false);

  /**
   * Location tracking start function
   * Depends on the current location mode
   */
  const startLocationTracking = useCallback(() => {
    // Current location mode check
    const currentLocationMode = locationMode;

    // If the current location mode is OFF, do not start location tracking
    if (currentLocationMode === LocationMode.OFF) {
      return;
    }

    // If location tracking is already in progress, stop and restart
    if (watchPositionIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchPositionIdRef.current);
      watchPositionIdRef.current = null;
    }

    if (navigator.geolocation) {
      // Set loading state (direct ref update)
      isLoadingLocationRef.current = true;

      // Request device orientation permission (if not already requested)
      if (!orientationPermissionRequested) {
        requestOrientationPermission().then(() => {
          setOrientationPermissionRequested(true);
        });
      }

      if (currentLocationMode === LocationMode.LOCATE) {
        // LOCATE mode: location tracking for a single location
        navigator.geolocation.getCurrentPosition(
          (position) => {
            // Reset loading state (direct ref update)
            isLoadingLocationRef.current = false;

            const newLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy,
              heading: position.coords.heading,
            };

            // LOCATE mode: heading information excluded, location only updated
            const locationWithoutHeading = {
              lat: newLocation.lat,
              lng: newLocation.lng,
              accuracy: newLocation.accuracy,
            };

            // LOCATE mode: move map center only once
            if (map && !locateInitializedRef.current) {
              // Maintain user zoom level
              const currentZoom = map.getZoom() || userZoomRef.current;
              map.setZoom(currentZoom);
              map.panTo(newLocation);

              // LOCATE mode: initialization completed flag
              locateInitializedRef.current = true;
            }

            // Location information update
            onLocationUpdate(locationWithoutHeading);
            setLocationLoaded(true);
            prevLocationRef.current = newLocation;
          },
          (error) => {
            // Error occurred: release loading state (direct ref update)
            isLoadingLocationRef.current = false;

            // Permission denied error: change location mode to OFF (handled in useEffect)
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
        // TRACKING mode: start location tracking
        const watchId = navigator.geolocation.watchPosition(
          (position) => {
            // Release loading state (direct ref update)
            isLoadingLocationRef.current = false;

            // Create location object with heading information
            const newLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy,
              // Use device heading first, then GPS heading, then previous heading
              heading:
                deviceHeading !== null
                  ? deviceHeading
                  : position.coords.heading !== null &&
                      position.coords.heading !== undefined
                    ? position.coords.heading
                    : prevLocationRef.current?.heading,
            };

            // TRACKING mode: move map center
            if (map) {
              // Current location mode check (latest state reference)
              if (locationMode === LocationMode.TRACKING) {
                // Maintain user zoom level
                const currentZoom = map.getZoom() || userZoomRef.current;
                map.setZoom(currentZoom);
                map.panTo(newLocation);
              }
            }

            // Location information update (heading information included)
            onLocationUpdate(newLocation);
            setLocationLoaded(true);
            prevLocationRef.current = newLocation;
          },
          (error) => {
            // Release loading state (direct ref update)
            isLoadingLocationRef.current = false;
            console.error("위치 추적 오류:", error);
          },
          {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 5000,
          }
        );

        // watchPosition ID storage
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
   * Stop location tracking function
   */
  const stopLocationTracking = useCallback(() => {
    if (watchPositionIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchPositionIdRef.current);
      watchPositionIdRef.current = null;
    }

    // Release loading state (direct ref update)
    isLoadingLocationRef.current = false;
  }, []);

  /**
   * Set location mode directly
   */
  const setLocationModeDirectly = useCallback((mode: LocationMode) => {
    setLocationMode(mode);
  }, []);

  /**
   * Toggle location mode function
   * OFF -> LOCATE -> TRACKING -> OFF sequence
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
  }, [locationMode, setLocationModeDirectly]);

  /**
   * Update tracking state when location mode changes
   */
  useEffect(() => {
    const currentLocationMode = locationMode;

    if (currentLocationMode === LocationMode.OFF) {
      // OFF mode: stop location tracking
      stopLocationTracking();

      // Previous location reference reset
      prevLocationRef.current = null;

      // LOCATE mode initialization reset
      locateInitializedRef.current = false;
    } else if (currentLocationMode === LocationMode.LOCATE) {
      // TRACKING mode: stop location tracking
      stopLocationTracking();

      // LOCATE mode: start location tracking
      startLocationTracking();
    } else if (currentLocationMode === LocationMode.TRACKING) {
      // LOCATE mode initialization reset
      locateInitializedRef.current = false;

      // TRACKING mode: start location tracking
      startLocationTracking();
    }

    // Error flag check
    if (errorRef.current === "PERMISSION_DENIED") {
      // Permission denied error: change location mode to OFF
      setLocationMode(LocationMode.OFF);
      errorRef.current = null;
    }
  }, [locationMode, startLocationTracking, stopLocationTracking]);

  /**
   * Stop location tracking when component unmounts
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
   * Save user zoom level when map object changes
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
    // Update location information logic improvement
    updateLocation: (newLocation: Coordinates) => {
      onLocationUpdate(newLocation);
      setLocationLoaded(true);
      prevLocationRef.current = newLocation;
    },
  };
};
