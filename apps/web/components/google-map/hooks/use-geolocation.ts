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
  initialFetch?: boolean;
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
  isTrackingMode: boolean = false,
  onPositionUpdate?: (location: Location) => void
): UseGeolocationReturn => {
  const {
    enableHighAccuracy = true,
    timeout = 5000,
    maximumAge = 0,
    autoGetLocation = true,
    initialFetch = false,
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
    // Update user location when heading changes from device orientation
    if (userLocation && heading !== null && isTrackingMode) {
      // Skip update if previous heading is the same as current heading
      const prevHeading = prevHeadingRef.current;
      if (prevHeading === heading) {
        return;
      }

      // Update only if the heading difference is significant (small changes are ignored)
      if (prevHeading !== null) {
        const angleDiff = Math.abs(heading - prevHeading);
        const normalizedDiff = angleDiff > 180 ? 360 - angleDiff : angleDiff;
        if (normalizedDiff < 3) {
          return;
        }
      }

      // Set heading update flag
      isHeadingUpdateRef.current = true;
      prevHeadingRef.current = heading;

      // Use requestAnimationFrame to avoid render cycles
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

      // Maintain previous location info (include heading)
      const prevLocation = userLocation;

      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          // Update loading ref directly
          isLoadingRef.current = false;

          // Create new location info (maintain previous heading)
          const newLocation = updateUserLocation(position);

          // Set heading update flag
          if (
            position.coords.heading !== null &&
            position.coords.heading !== undefined
          ) {
            isHeadingUpdateRef.current = true;
          }

          // Update location
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

  // Update location function
  const updateUserLocation = useCallback(
    (position: GeolocationPosition) => {
      // Create new location info
      const newLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        // Heading processing (update if new heading exists, otherwise maintain previous heading)
        heading:
          position.coords.heading !== null &&
          position.coords.heading !== undefined
            ? position.coords.heading
            : userLocation?.heading || null,
      };

      // Update location
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
