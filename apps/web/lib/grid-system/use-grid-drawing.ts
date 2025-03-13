import { useCallback, useRef } from "react";
import { calculateGridCellSize } from "./utils";
import { Coordinates } from "./types";

/**
 * Hook for grid drawing functionality
 */
export function useGridDrawing() {
  // Grid lines management - managed by reference for direct manipulation without state changes
  const gridLinesRef = useRef<google.maps.Polyline[]>([]);
  const selectedRectangleRef = useRef<google.maps.Rectangle | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);

  // Remove all grid lines
  const clearAllGridLines = useCallback(() => {
    console.log("Clearing all grid lines");
    // Remove all grid lines from the map
    gridLinesRef.current.forEach((line) => {
      line.setMap(null);
    });

    // Reset reference array
    gridLinesRef.current = [];

    // Clear selected rectangle if exists
    if (selectedRectangleRef.current) {
      console.log("Clearing selected rectangle");
      selectedRectangleRef.current.setMap(null);
      selectedRectangleRef.current = null;
    }

    return true;
  }, []);

  // Draw selected area rectangle
  const drawSelectedAreaRectangle = useCallback(
    (mapInstance: google.maps.Map, selectedArea: Coordinates) => {
      console.log("Drawing selected area rectangle for:", selectedArea);

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
        const { latDegreePerCell, lngDegreePerCell } =
          calculateGridCellSize(centerLat);

        // Calculate grid cell indices
        const latIndex = Math.floor(selectedArea.lat / latDegreePerCell);
        const lngIndex = Math.floor(selectedArea.lng / lngDegreePerCell);

        // Calculate rectangle bounds
        const north = (latIndex + 1) * latDegreePerCell;
        const south = latIndex * latDegreePerCell;
        const east = (lngIndex + 1) * lngDegreePerCell;
        const west = lngIndex * lngDegreePerCell;

        console.log("Rectangle bounds:", { north, south, east, west });

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
          zIndex: 100, // Ensure it's above the grid lines
        });

        console.log("Rectangle created successfully");
      } catch (error) {
        console.error("Error drawing rectangle:", error);
      }
    },
    []
  );

  return {
    gridLinesRef,
    selectedRectangleRef,
    mapInstanceRef,
    clearAllGridLines,
    drawSelectedAreaRectangle,
  };
}
