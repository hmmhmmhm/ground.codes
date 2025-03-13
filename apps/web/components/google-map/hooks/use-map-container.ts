import { useState, useCallback, useEffect } from "react";
import { useGridSystem } from "@/lib/grid-system";
import { useMapCoordinates } from "./use-map-coordinates";
import { useGeolocation } from "./use-geolocation";
import { googleMapDarkTheme } from "@/lib/map/google-map-theme";
import { useJsApiLoader } from "@react-google-maps/api";
import { useLanguage } from "./use-language";

interface Coordinates {
  lat: number;
  lng: number;
}

const defaultCenter = {
  lat: 37.5665,
  lng: 126.978,
};

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

  // User location state
  const [userLocationLoaded, setUserLocationLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);

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
    getUserLocation,
  } = useGeolocation(map, setCenter, setSelectedArea, {
    autoGetLocation: true,
  });

  // Update user location state when geolocation changes
  useEffect(() => {
    if (geoLocation) {
      setUserLocation(geoLocation);
    }
    setUserLocationLoaded(geoLocationLoaded);
  }, [geoLocation, geoLocationLoaded]);

  // Get encoded coordinates using the hook
  const {
    encodedCoordinatesEN,
    encodedCoordinatesKR,
    isEncodingEN,
    isEncodingKR,
    encodeSelectedAreaCoordinates,
  } = useMapCoordinates(selectedArea);

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
    [map, searchMarker, infoWindow]
  );

  // Map load handler
  const onLoad = useCallback(
    (mapInstance: google.maps.Map) => {
      console.log("Map loaded");
      mapInstance.setOptions({ 
        styles: googleMapDarkTheme,
        mapTypeId: mapType as google.maps.MapTypeId,
        mapTypeControl: false,
        fullscreenControl: false
      });

      if (userLocationLoaded && userLocation) {
        mapInstance.panTo(userLocation);
        mapInstance.setZoom(18);
      }

      setMap(mapInstance);
    },
    [userLocation, userLocationLoaded, mapType]
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
      handleGridCellClick(e);
    },
    [handleGridCellClick]
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
    const mapElement = document.querySelector('.map-container');
    if (!mapElement) {
      console.error('Map container element not found');
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
        console.error('Failed to enter fullscreen mode:', error);
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
        console.error('Failed to exit fullscreen mode:', error);
      }
    }
    
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  // Listen for fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  return {
    // Loading state
    isLoaded,

    // Map state
    map,
    center,
    mapType,
    toggleMapType,
    isFullscreen,
    toggleFullscreen,

    // User location state
    userLocation,
    userLocationLoaded,
    getUserLocation,

    // Grid state
    showGrid,
    toggleGrid,

    // Selected area state
    selectedArea,

    // Search state
    searchedPlace,
    handlePlaceSelect,

    // Coordinates encoding state
    encodedCoordinatesEN,
    encodedCoordinatesKR,
    isEncodingEN,
    isEncodingKR,

    // Map event handlers
    onLoad,
    onUnmount,
    onMapClick,
  };
};
