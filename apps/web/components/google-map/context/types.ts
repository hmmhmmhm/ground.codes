import { ReactNode } from "react";

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface MapContextType {
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
  encodedCoordinates: string;
  isEncoding: boolean;
  encodeSelectedAreaCoordinates: () => Promise<void>;

  // Grid system functions
  drawGrid: (mapInstance: google.maps.Map) => void;
  clearAllGridLines: () => void;
  setupMapEventHandlers: (mapInstance: google.maps.Map) => void;
  removeMapEventHandlers: (mapInstance: google.maps.Map) => void;
  handleGridCellClick: (e: google.maps.MapMouseEvent) => void;

  // Map event handlers
  onUnmount: (mapInstance: google.maps.Map) => void;
}

export interface MapProviderProps {
  children: ReactNode;
}

export const defaultCenter = {
  lat: 37.5665,
  lng: 126.978,
};
