import { useCallback } from "react";
import { Coordinates } from "./types";
import { getGridCellCenter } from "./utils";

/**
 * Hook for map event handlers
 */
export function useMapEventHandlers(
  showGrid: boolean,
  drawGrid: (mapInstance: google.maps.Map) => void,
  handleGridCellClick: (e: google.maps.MapMouseEvent) => void
) {
  return useCallback(
    (mapInstance: google.maps.Map) => {
      // Store initial zoom level
      const currentZoomRef = { current: mapInstance.getZoom() || null };

      // Draw grid when map movement is complete
      mapInstance.addListener("idle", () => {
        // Only draw grid when showGrid is true
        if (showGrid) drawGrid(mapInstance);
      });

      // Add click event listener to map
      mapInstance.addListener("click", (e: google.maps.MapMouseEvent) => {
        handleGridCellClick(e);
      });
    },
    [drawGrid, showGrid, handleGridCellClick]
  );
}

/**
 * Hook for grid cell click handler
 */
export function useGridCellClickHandler(
  showGrid: boolean,
  isGridVisibleAtZoom: (zoom: number | undefined) => boolean,
  mapInstanceRef: React.MutableRefObject<google.maps.Map | null>,
  setSelectedArea: React.Dispatch<React.SetStateAction<Coordinates | null>>,
  drawGrid: (mapInstance: google.maps.Map) => void
) {
  return useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;

      // Get map instance from event or from ref
      let mapInstance = (e.latLng as any).map;
      if (!mapInstance) {
        if (mapInstanceRef.current) {
          mapInstance = mapInstanceRef.current;
        } else {
          return;
        }
      } else {
        return;
      }

      // Check if grid should be visible at current zoom level
      const zoom = mapInstance.getZoom();
      if (!isGridVisibleAtZoom(zoom)) return;

      const clickedLat = e.latLng.lat();
      const clickedLng = e.latLng.lng();

      // Get map center for grid cell size calculation
      const bounds = mapInstance.getBounds();
      if (!bounds) {
        console.error("Map bounds not available");
        return;
      }

      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      const centerLat = (ne.lat() + sw.lat()) / 2;

      // Get the center of the grid cell that was clicked
      const cellCenter = getGridCellCenter(clickedLat, clickedLng, centerLat);

      // Update selected area state
      setSelectedArea(cellCenter);

      // Redraw grid to show selected area
      drawGrid(mapInstance);
    },
    [showGrid, isGridVisibleAtZoom, mapInstanceRef, setSelectedArea, drawGrid]
  );
}

/**
 * Function to remove map event handlers
 */
export const removeMapEventHandlers = (mapInstance: google.maps.Map) => {
  google.maps.event.clearListeners(mapInstance, "idle");
  google.maps.event.clearListeners(mapInstance, "dragstart");
  google.maps.event.clearListeners(mapInstance, "zoom_changed");
  google.maps.event.clearListeners(mapInstance, "click");
};
