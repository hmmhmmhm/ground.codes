import { useCallback, useRef, useState, Dispatch, SetStateAction } from "react";

/**
 * Meters per degree of latitude (approximately 111,000m)
 */
export const DEG_PER_METER = 111000;

/**
 * Grid size (in meters)
 */
export const GRID_SIZE_METERS = 3;

/**
 * Calculate grid cell size based on latitude (in degrees)
 */
export function calculateGridCellSize(
  latitude: number,
  precisionMeters: number = GRID_SIZE_METERS
) {
  // Grid size in latitude direction (north-south)
  const latDegreePerCell = precisionMeters / DEG_PER_METER;

  // Grid size in longitude direction (east-west) (adjusted according to latitude)
  const lngDegreePerCell =
    precisionMeters / (DEG_PER_METER * Math.cos((latitude * Math.PI) / 180));

  console.log("Grid cell size:", { latDegreePerCell, lngDegreePerCell });
  return { latDegreePerCell, lngDegreePerCell };
}

/**
 * Get the center coordinates of the grid cell that contains the given point
 */
export function getGridCellCenter(
  lat: number,
  lng: number,
  centerLat: number
): { lat: number; lng: number } {
  const { latDegreePerCell, lngDegreePerCell } =
    calculateGridCellSize(centerLat);

  // Calculate the grid cell indices
  const latIndex = Math.floor(lat / latDegreePerCell);
  const lngIndex = Math.floor(lng / lngDegreePerCell);

  // Calculate the center of the grid cell
  const centerLatCoord = latIndex * latDegreePerCell + latDegreePerCell / 2;
  const centerLngCoord = lngIndex * lngDegreePerCell + lngDegreePerCell / 2;

  console.log("Grid cell center calculation:", {
    input: { lat, lng, centerLat },
    cellSizes: { latDegreePerCell, lngDegreePerCell },
    indices: { latIndex, lngIndex },
    result: { lat: centerLatCoord, lng: centerLngCoord },
  });

  return { lat: centerLatCoord, lng: centerLngCoord };
}

/**
 * Grid system hook
 * Provides functionality to draw and manage grid lines on the map
 */
export function useGridSystem(
  showGrid: boolean,
  selectedArea: { lat: number; lng: number } | null,
  setSelectedArea: Dispatch<SetStateAction<{ lat: number; lng: number } | null>>
) {
  // Grid lines management - managed by reference for direct manipulation without state changes
  const gridLinesRef = useRef<google.maps.Polyline[]>([]);
  const selectedRectangleRef = useRef<google.maps.Rectangle | null>(null);
  const currentZoomRef = useRef<number | null>(null);
  const gridVisibleRef = useRef<boolean>(false);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);

  // Check if grid should be visible at current zoom level
  const isGridVisibleAtZoom = useCallback((zoom: number | undefined) => {
    const isVisible = zoom !== undefined && zoom >= 16;
    console.log("Grid visibility check:", { zoom, isVisible });
    return isVisible;
  }, []);

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

    // Update grid visibility state
    gridVisibleRef.current = false;
  }, []);

  // Draw selected area rectangle
  const drawSelectedAreaRectangle = useCallback(
    (
      mapInstance: google.maps.Map,
      selectedArea: { lat: number; lng: number }
    ) => {
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
        const maxLines = 100;
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

  // Handle grid cell click
  const handleGridCellClick = useCallback(
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

      if (!showGrid) {
        console.log("Grid is not enabled, ignoring click");
        return;
      }

      if (!isGridVisibleAtZoom(zoom)) {
        console.log("Grid not visible at current zoom, ignoring click");
        return;
      }

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
    [showGrid, setSelectedArea, drawGrid, isGridVisibleAtZoom]
  );

  // Set up map event handlers
  const setupMapEventHandlers = useCallback(
    (mapInstance: google.maps.Map) => {
      console.log("Setting up map event handlers");

      // Store map instance reference
      mapInstanceRef.current = mapInstance;

      // Store initial zoom level
      currentZoomRef.current = mapInstance.getZoom() || null;
      console.log("Initial zoom level:", currentZoomRef.current);

      // Draw grid when map movement is complete
      mapInstance.addListener("idle", () => {
        // Only draw grid when showGrid is true
        if (showGrid) {
          console.log("Map idle, redrawing grid");
          drawGrid(mapInstance);
        }
      });

      // Hide grid lines when drag starts
      mapInstance.addListener("dragstart", () => {
        console.log("Map drag started, hiding grid");
        // Hide grid lines during drag (for performance improvement)
        gridLinesRef.current.forEach((line) => {
          line.setMap(null);
        });

        // Hide selected rectangle during drag
        if (selectedRectangleRef.current) {
          selectedRectangleRef.current.setMap(null);
        }
      });

      // Hide grid lines when zoom changes
      mapInstance.addListener("zoom_changed", () => {
        const zoom = mapInstance.getZoom();
        currentZoomRef.current = zoom || null;
        console.log("Zoom changed to:", zoom);

        // Hide grid during zoom changes
        gridLinesRef.current.forEach((line) => {
          line.setMap(null);
        });

        // Hide selected rectangle during zoom
        if (selectedRectangleRef.current) {
          selectedRectangleRef.current.setMap(null);
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

  // Remove event listeners
  const removeMapEventHandlers = useCallback((mapInstance: google.maps.Map) => {
    console.log("Removing map event handlers");
    google.maps.event.clearListeners(mapInstance, "idle");
    google.maps.event.clearListeners(mapInstance, "dragstart");
    google.maps.event.clearListeners(mapInstance, "zoom_changed");
    google.maps.event.clearListeners(mapInstance, "click");
  }, []);

  return {
    drawGrid,
    clearAllGridLines,
    setupMapEventHandlers,
    removeMapEventHandlers,
    handleGridCellClick,
    isGridVisibleAtZoom,
  };
}
