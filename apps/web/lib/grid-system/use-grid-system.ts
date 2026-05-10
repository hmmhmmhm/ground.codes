import { useCallback, Dispatch, SetStateAction } from "react";
import { chooseVisibleGridMetrics } from "./utils";
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
  setSelectedArea: Dispatch<SetStateAction<Coordinates | null>>,
  mapOptions?: {
    locationMode?: any;
    setLocationMode?: (mode: any) => void;
    placeDetailsVisible?: boolean;
    setPlaceDetailsVisible?: (visible: boolean) => void;
    setSelectedPlaceId?: (placeId: string | null) => void;
    setSelectedLocation?: (location: google.maps.LatLng | null) => void;
    setShowInfoWindow?: (show: boolean) => void;
    metersPerDegree?: number;
  },
): GridSystemHookResult {
  const metersPerDegree = mapOptions?.metersPerDegree;
  const isPlanetaryGrid =
    metersPerDegree !== undefined && metersPerDegree < 100000;
  const {
    gridLinesRef,
    selectedRectangleRef,
    mapInstanceRef,
    clearAllGridLines,
    drawSelectedAreaRectangle,
  } = useGridDrawing(metersPerDegree);

  const { currentZoomRef, gridVisibleRef, isGridVisibleAtZoom } =
    useGridVisibility(isPlanetaryGrid ? 5 : 16);

  // Draw grid lines
  const drawGrid = useCallback(
    (mapInstance: google.maps.Map) => {
      // Store map instance reference
      mapInstanceRef.current = mapInstance;

      // First remove all existing grid lines
      clearAllGridLines();

      // Don't draw if grid is disabled
      if (!showGrid) {
        gridVisibleRef.current = false;
        return;
      }

      // Check zoom level (only show grid at zoom level 16 or higher)
      const zoom = mapInstance.getZoom();
      currentZoomRef.current = zoom || null;

      if (!isGridVisibleAtZoom(zoom)) {
        gridVisibleRef.current = false;
        return;
      }

      try {
        // Get map boundaries
        const bounds = mapInstance.getBounds();
        if (!bounds) {
          // Schedule a redraw after a short delay to allow bounds to become available
          setTimeout(() => {
            if (mapInstanceRef.current) drawGrid(mapInstanceRef.current);
          }, 500);
          return;
        }

        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();

        // Calculate map center
        const centerLat = (ne.lat() + sw.lat()) / 2;

        const {
          latDegreePerCell,
          lngDegreePerCell,
          startLat,
          endLat,
          startLng,
          endLng,
          latLines,
          lngLines,
        } = chooseVisibleGridMetrics(bounds, centerLat, metersPerDegree);

        // Update grid visibility state
        gridVisibleRef.current = true;

        const newLines: google.maps.Polyline[] = [];

        // Draw horizontal lines (latitude lines)
        for (let i = 0; i < latLines; i++) {
          const lat = startLat + i * latDegreePerCell;
          const line = new google.maps.Polyline({
            path: [
              { lat, lng: startLng },
              { lat, lng: endLng },
            ],
            strokeColor: isPlanetaryGrid ? "#EAF2FF" : "#808080",
            strokeOpacity: isPlanetaryGrid ? 0.34 : 0.05,
            strokeWeight: isPlanetaryGrid ? 1 : 1.5,
            map: mapInstance,
            clickable: false,
            zIndex: isPlanetaryGrid ? 10 : undefined,
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
            strokeColor: isPlanetaryGrid ? "#EAF2FF" : "#808080",
            strokeOpacity: isPlanetaryGrid ? 0.34 : 0.05,
            strokeWeight: isPlanetaryGrid ? 1 : 1.5,
            map: mapInstance,
            clickable: false,
            zIndex: isPlanetaryGrid ? 10 : undefined,
          });
          newLines.push(line);
        }

        // Store new grid lines in reference array
        gridLinesRef.current = newLines;

        // Draw selected area rectangle if there's a selected area
        if (selectedArea) {
          drawSelectedAreaRectangle(mapInstance, selectedArea);
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
      metersPerDegree,
      isPlanetaryGrid,
    ],
  );

  // Create the grid cell click handler
  const handleGridCellClick = useGridCellClickHandler(
    showGrid,
    isGridVisibleAtZoom,
    mapInstanceRef,
    setSelectedArea,
    drawGrid,
    metersPerDegree,
  );

  // Create the map event handlers setup function with enhanced options
  const setupMapEventHandlers = useMapEventHandlers(
    showGrid,
    drawGrid,
    handleGridCellClick,
    {
      ...mapOptions,
      setSelectedArea,
    },
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
