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
      console.log("Setting up map event handlers");

      // Store initial zoom level
      const currentZoomRef = { current: mapInstance.getZoom() || null };
      console.log("Initial zoom level:", currentZoomRef.current);

      // Draw grid when map movement is complete
      mapInstance.addListener("idle", () => {
        // Only draw grid when showGrid is true
        if (showGrid) {
          console.log("Map idle, redrawing grid");
          drawGrid(mapInstance);
        }
      });

      // Add click event listener to map
      mapInstance.addListener("click", (e: google.maps.MapMouseEvent) => {
        console.log("Map click detected, forwarding to handleGridCellClick");
        handleGridCellClick(e);
      });

      console.log("Map event handlers set up successfully");
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
      console.log("Grid cell click detected");

      if (!e.latLng) {
        console.error("No latLng in click event");
        return;
      }

      // Get map instance from event or from ref
      let mapInstance = (e.latLng as any).map;
      if (!mapInstance) {
        if (mapInstanceRef.current) {
          console.log("Using stored map instance reference");
          mapInstance = mapInstanceRef.current;
        } else {
          console.error(
            "No map instance in click event and no stored reference"
          );
          return;
        }
      } else {
        return;
      }

      // Check if grid should be visible at current zoom level
      const zoom = mapInstance.getZoom();
      console.log("Click at zoom level:", zoom);

      const clickedLat = e.latLng.lat();
      const clickedLng = e.latLng.lng();
      console.log("Click coordinates:", { lat: clickedLat, lng: clickedLng });

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
      console.log("Selected cell center:", cellCenter);

      // Update selected area state
      setSelectedArea(cellCenter);
      console.log("Selected area state updated");

      // Redraw grid to show selected area
      console.log("Redrawing grid with selected area");
      drawGrid(mapInstance);
    },
    [showGrid, isGridVisibleAtZoom, mapInstanceRef, setSelectedArea, drawGrid]
  );
}

/**
 * Function to remove map event handlers
 */
export const removeMapEventHandlers = (mapInstance: google.maps.Map) => {
  console.log("Removing map event handlers");
  google.maps.event.clearListeners(mapInstance, "idle");
  google.maps.event.clearListeners(mapInstance, "dragstart");
  google.maps.event.clearListeners(mapInstance, "zoom_changed");
  google.maps.event.clearListeners(mapInstance, "click");
};
