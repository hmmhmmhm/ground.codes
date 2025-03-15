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
}

interface UseGeolocationReturn {
  userLocation: Location | null;
  userLocationLoaded: boolean;
  getUserLocation: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  requestOrientationPermission: () => Promise<boolean>;
}

export const useGeolocation = (
  map: google.maps.Map | null,
  setCenter?: (location: Location) => void,
  setSelectedArea?: (location: Location) => void,
  options: UseGeolocationOptions = {}
): UseGeolocationReturn => {
  const {
    enableHighAccuracy = true,
    timeout = 5000,
    maximumAge = 0,
    autoGetLocation = true,
  } = options;

  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [userLocationLoaded, setUserLocationLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Use a ref to track if this is just a heading update
  const isHeadingUpdateRef = useRef(false);
  
  // Use the device orientation hook
  const { heading, requestPermission } = useDeviceOrientation();

  // Update user location when heading changes from device orientation
  useEffect(() => {
    if (userLocation && heading !== null) {
      // Only update heading without triggering map re-centering
      isHeadingUpdateRef.current = true;
      setUserLocation(prev => prev ? { ...prev, heading } : null);
    }
  }, [heading, userLocation]);

  const getUserLocation = useCallback(() => {
    if (navigator.geolocation) {
      setIsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // This is a full position update, not just heading
          isHeadingUpdateRef.current = false;
          
          const newUserLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            heading: position.coords.heading || heading,
          };
          setUserLocation(newUserLocation);
          
          // Only update center and selected area for full position updates
          if (setCenter) setCenter(newUserLocation);
          setUserLocationLoaded(true);
          if (setSelectedArea) setSelectedArea(newUserLocation);

          // Only pan the map for full position updates (not heading updates)
          if (map) {
            map.panTo(newUserLocation);
            map.setZoom(18);
          }
          setIsLoading(false);
        },
        (error) => {
          console.error("Error getting user location:", error);
          setUserLocationLoaded(true);
          setIsLoading(false);
        },
        {
          enableHighAccuracy,
          timeout,
          maximumAge,
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
      setUserLocationLoaded(true);
      setIsLoading(false);
    }
  }, [
    map,
    setCenter,
    setSelectedArea,
    enableHighAccuracy,
    timeout,
    maximumAge,
    heading,
  ]);

  useEffect(() => {
    if (autoGetLocation) {
      getUserLocation();
    }
  }, [autoGetLocation, getUserLocation]);

  return {
    userLocation,
    userLocationLoaded,
    getUserLocation,
    isLoading,
    setIsLoading,
    requestOrientationPermission: requestPermission,
  };
};
