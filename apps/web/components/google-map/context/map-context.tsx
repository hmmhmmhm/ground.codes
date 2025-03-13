import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useGridSystem } from '@/lib/map/grid-system';
import { useMapCoordinates } from '../hooks/use-map-coordinates';
import { useGeolocation } from '../hooks/use-geolocation';
import { googleMapDarkTheme } from '@/lib/map/google-map-theme';

interface Coordinates {
  lat: number;
  lng: number;
}

interface MapContextType {
  // Map state
  map: google.maps.Map | null;
  setMap: (map: google.maps.Map | null) => void;
  center: Coordinates;
  setCenter: (center: Coordinates) => void;
  
  // User location state
  userLocation: Coordinates | null;
  userLocationLoaded: boolean;
  getUserLocation: () => void;
  
  // Grid state
  showGrid: boolean;
  toggleGrid: () => void;
  
  // Selected area state
  selectedArea: Coordinates | null;
  setSelectedArea: React.Dispatch<React.SetStateAction<Coordinates | null>>;
  
  // Coordinates encoding state
  encodedCoordinatesEN: string;
  encodedCoordinatesKR: string;
  isEncodingEN: boolean;
  isEncodingKR: boolean;
  
  // Grid system functions
  drawGrid: (mapInstance: google.maps.Map) => void;
  clearAllGridLines: () => void;
  setupMapEventHandlers: (mapInstance: google.maps.Map) => void;
  removeMapEventHandlers: (mapInstance: google.maps.Map) => void;
  handleGridCellClick: (e: google.maps.MapMouseEvent) => void;
  
  // Map event handlers
  onLoad: (mapInstance: google.maps.Map) => void;
  onUnmount: (mapInstance: google.maps.Map) => void;
  onMapClick: (e: google.maps.MapMouseEvent) => void;
}

const defaultCenter = {
  lat: 37.5665,
  lng: 126.978,
};

export const MapContext = createContext<MapContextType | null>(null);

export const MapProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Map state
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [center, setCenter] = useState(defaultCenter);
  
  // User location state
  const [userLocationLoaded, setUserLocationLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  
  // Grid state
  const [showGrid, setShowGrid] = useState(true);
  
  // Selected area state
  const [selectedArea, setSelectedArea] = useState<Coordinates | null>(null);

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

  // Map load handler
  const onLoad = useCallback(
    (mapInstance: google.maps.Map) => {
      console.log("Map loaded");
      mapInstance.setOptions({ styles: googleMapDarkTheme });

      if (userLocationLoaded && userLocation) {
        mapInstance.panTo(userLocation);
        mapInstance.setZoom(18);
      }

      setMap(mapInstance);
    },
    [userLocation, userLocationLoaded]
  );

  // Map unmount handler
  const onUnmount = useCallback(
    (mapInstance: google.maps.Map) => {
      console.log("Map unmounting");
      clearAllGridLines();
      removeMapEventHandlers(mapInstance);
      setMap(null);
    },
    [clearAllGridLines, removeMapEventHandlers]
  );

  // Map click handler
  const onMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      console.log("Map click in component:", e.latLng?.toString());
      handleGridCellClick(e);
    },
    [handleGridCellClick]
  );

  const contextValue: MapContextType = {
    map,
    setMap,
    center,
    setCenter,
    userLocation,
    userLocationLoaded,
    getUserLocation,
    showGrid,
    toggleGrid,
    selectedArea,
    setSelectedArea,
    encodedCoordinatesEN,
    encodedCoordinatesKR,
    isEncodingEN,
    isEncodingKR,
    drawGrid,
    clearAllGridLines,
    setupMapEventHandlers,
    removeMapEventHandlers,
    handleGridCellClick,
    onLoad,
    onUnmount,
    onMapClick,
  };

  return (
    <MapContext.Provider value={contextValue}>
      {children}
    </MapContext.Provider>
  );
};

export const useMapContext = () => {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMapContext must be used within a MapProvider');
  }
  return context;
};
