import { Dispatch, SetStateAction } from "react";

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface GridCellSize {
  latDegreePerCell: number;
  lngDegreePerCell: number;
}

export interface GridSystemHookResult {
  drawGrid: (mapInstance: google.maps.Map) => void;
  clearAllGridLines: () => void;
  setupMapEventHandlers: (mapInstance: google.maps.Map) => void;
  removeMapEventHandlers: (mapInstance: google.maps.Map) => void;
  handleGridCellClick: (e: google.maps.MapMouseEvent) => void;
  isGridVisibleAtZoom: (zoom: number | undefined) => boolean;
}
