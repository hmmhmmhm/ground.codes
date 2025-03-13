import { useState, useCallback, useEffect } from "react";

interface Location {
  lat: number;
  lng: number;
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

  const getUserLocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newUserLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(newUserLocation);
          if (setCenter) setCenter(newUserLocation);
          setUserLocationLoaded(true);
          if (setSelectedArea) setSelectedArea(newUserLocation);

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
          enableHighAccuracy,
          timeout,
          maximumAge,
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
      setUserLocationLoaded(true);
    }
  }, [
    map,
    setCenter,
    setSelectedArea,
    enableHighAccuracy,
    timeout,
    maximumAge,
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
  };
};
