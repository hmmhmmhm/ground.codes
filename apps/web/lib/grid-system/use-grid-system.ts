import { useCallback, Dispatch, SetStateAction } from "react";
import { calculateGridCellSize } from "./utils";
import { useGridDrawing } from "./use-grid-drawing";
import { useGridVisibility } from "./use-grid-visibility";
import { Coordinates, GridSystemHookResult } from "./types";
import {
  useMapEventHandlers,
  useGridCellClickHandler,
  removeMapEventHandlers,
} from "./use-map-handlers";

/**
 * Grid system hook
 * Provides functionality to draw and manage grid lines on the map
 */
export function useGridSystem(
  showGrid: boolean,
  selectedArea: Coordinates | null,
  setSelectedArea: Dispatch<SetStateAction<Coordinates | null>>
): GridSystemHookResult {
  const {
    gridLinesRef,
    selectedRectangleRef,
    mapInstanceRef,
    clearAllGridLines,
    drawSelectedAreaRectangle,
  } = useGridDrawing();

  const { currentZoomRef, gridVisibleRef, isGridVisibleAtZoom } =
    useGridVisibility();

  // Draw grid lines
  const drawGrid = useCallback(
    (mapInstance: google.maps.Map) => {
      console.log("Drawing grid, showGrid:", showGrid);

      // Store map instance reference
      mapInstanceRef.current = mapInstance;

      // First remove all existing grid lines
      clearAllGridLines();

      // Don't draw if grid is disabled
      if (!showGrid) {
        console.log("Grid is disabled, not drawing");
        gridVisibleRef.current = false;
        return;
      }

      // Check zoom level (only show grid at zoom level 16 or higher)
      const zoom = mapInstance.getZoom();
      currentZoomRef.current = zoom || null;
      console.log("Current zoom level:", zoom);

      if (!isGridVisibleAtZoom(zoom)) {
        console.log("Grid not visible at current zoom level");
        gridVisibleRef.current = false;
        return;
      }

      try {
        // Get map boundaries
        const bounds = mapInstance.getBounds();
        if (!bounds) {
          console.warn("Map bounds not available, waiting for map to be idle");
          // Schedule a redraw after a short delay to allow bounds to become available
          setTimeout(() => {
            if (mapInstanceRef.current) {
              console.log("Retrying grid draw after delay");
              drawGrid(mapInstanceRef.current);
            }
          }, 500);
          return;
        }

        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();

        // Calculate map center
        const centerLat = (ne.lat() + sw.lat()) / 2;

        // Calculate grid cell size (in degrees)
        const { latDegreePerCell, lngDegreePerCell } =
          calculateGridCellSize(centerLat);

        // Calculate grid start and end points (aligned precisely to grid size)
        const startLat =
          Math.floor(sw.lat() / latDegreePerCell) * latDegreePerCell;
        const endLat =
          Math.ceil(ne.lat() / latDegreePerCell) * latDegreePerCell;
        const startLng =
          Math.floor(sw.lng() / lngDegreePerCell) * lngDegreePerCell;
        const endLng =
          Math.ceil(ne.lng() / lngDegreePerCell) * lngDegreePerCell;

        // Calculate number of grid cells
        const latLines = Math.round((endLat - startLat) / latDegreePerCell) + 1;
        const lngLines = Math.round((endLng - startLng) / lngDegreePerCell) + 1;

        console.log("Grid dimensions:", { latLines, lngLines });

        // Limit the number of grid cells (to prevent performance issues)
        const maxLines = 150;
        if (latLines > maxLines || lngLines > maxLines) {
          console.log("Too many grid lines, not drawing");
          gridVisibleRef.current = false;
          return;
        }

        // Update grid visibility state
        gridVisibleRef.current = true;
        console.log("Grid is now visible");

        const newLines: google.maps.Polyline[] = [];

        // Draw horizontal lines (latitude lines)
        for (let i = 0; i < latLines; i++) {
          const lat = startLat + i * latDegreePerCell;
          const line = new google.maps.Polyline({
            path: [
              { lat, lng: startLng },
              { lat, lng: endLng },
            ],
            strokeColor: "#808080",
            strokeOpacity: 0.4,
            strokeWeight: 1.5,
            map: mapInstance,
            clickable: false,
          });
          newLines.push(line);
        }

        // Draw vertical lines (longitude lines)
        for (let i = 0; i < lngLines; i++) {
          const lng = startLng + i * lngDegreePerCell;
          const line = new google.maps.Polyline({
            path: [
              { lat: startLat, lng },
              { lat: endLat, lng },
            ],
            strokeColor: "#808080",
            strokeOpacity: 0.4,
            strokeWeight: 1.5,
            map: mapInstance,
            clickable: false,
          });
          newLines.push(line);
        }

        // Store new grid lines in reference array
        gridLinesRef.current = newLines;
        console.log(`Grid drawn with ${newLines.length} lines`);

        // Draw selected area rectangle if there's a selected area
        if (selectedArea) {
          console.log("Drawing selected area rectangle");
          drawSelectedAreaRectangle(mapInstance, selectedArea);
        } else {
          console.log("No selected area to draw");
        }
      } catch (error) {
        console.error("Error drawing grid:", error);
        gridVisibleRef.current = false;
      }
    },
    [
      showGrid,
      clearAllGridLines,
      selectedArea,
      drawSelectedAreaRectangle,
      isGridVisibleAtZoom,
    ]
  );

  // Create the grid cell click handler
  const handleGridCellClick = useGridCellClickHandler(
    showGrid,
    isGridVisibleAtZoom,
    mapInstanceRef,
    setSelectedArea,
    drawGrid
  );

  // Create the map event handlers setup function
  const setupMapEventHandlers = useMapEventHandlers(
    showGrid,
    drawGrid,
    handleGridCellClick
  );

  return {
    drawGrid,
    clearAllGridLines,
    setupMapEventHandlers,
    removeMapEventHandlers,
    handleGridCellClick,
    isGridVisibleAtZoom,
  };
}
