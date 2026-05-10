import { useCallback, useRef } from "react";
import { calculateGridCellSize } from "./utils";
import { Coordinates } from "./types";

/**
 * Hook for grid drawing functionality
 */
export function useGridDrawing(metersPerDegree?: number) {
  // Grid lines management - managed by reference for direct manipulation without state changes
  const gridLinesRef = useRef<google.maps.Polyline[]>([]);
  const selectedRectangleRef = useRef<google.maps.Rectangle | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);

  // Remove all grid lines
  const clearAllGridLines = useCallback(() => {
    // Remove all grid lines from the map
    gridLinesRef.current.forEach((line) => {
      line.setMap(null);
    });

    // Reset reference array
    gridLinesRef.current = [];

    // Clear selected rectangle if exists
    if (selectedRectangleRef.current) {
      selectedRectangleRef.current.setMap(null);
      selectedRectangleRef.current = null;
    }

    return true;
  }, []);

  // Draw selected area rectangle
  const drawSelectedAreaRectangle = useCallback(
    (mapInstance: google.maps.Map, selectedArea: Coordinates) => {
      // Clear previous rectangle if exists
      if (selectedRectangleRef.current) {
        selectedRectangleRef.current.setMap(null);
        selectedRectangleRef.current = null;
      }

      try {
        // Get map center for grid cell size calculation
        const bounds = mapInstance.getBounds();
        if (!bounds) {
          console.error("Map bounds not available");
          return;
        }

        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        const centerLat = (ne.lat() + sw.lat()) / 2;

        // Calculate grid cell size
        const { latDegreePerCell, lngDegreePerCell } = calculateGridCellSize(
          centerLat,
          undefined,
          metersPerDegree,
        );

        // Calculate grid cell indices
        const latIndex = Math.floor(selectedArea.lat / latDegreePerCell);
        const lngIndex = Math.floor(selectedArea.lng / lngDegreePerCell);

        // Calculate rectangle bounds
        const north = (latIndex + 1) * latDegreePerCell;
        const south = latIndex * latDegreePerCell;
        const east = (lngIndex + 1) * lngDegreePerCell;
        const west = lngIndex * lngDegreePerCell;

        // Create rectangle
        selectedRectangleRef.current = new google.maps.Rectangle({
          bounds: {
            north,
            south,
            east,
            west,
          },
          strokeColor: "#FF5722",
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: "#FF5722",
          fillOpacity: 0.35,
          map: mapInstance,
          zIndex: 100,
        });
      } catch (error) {
        console.error("Error drawing rectangle:", error);
      }
    },
    [metersPerDegree],
  );

  return {
    gridLinesRef,
    selectedRectangleRef,
    mapInstanceRef,
    clearAllGridLines,
    drawSelectedAreaRectangle,
  };
}
