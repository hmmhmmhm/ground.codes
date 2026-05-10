import { useCallback } from "react";
import { Coordinates } from "./types";
import { getGridCellCenter } from "./utils";

/**
 * Hook for map event handlers
 */
export function useMapEventHandlers(
  showGrid: boolean,
  drawGrid: (mapInstance: google.maps.Map) => void,
  handleGridCellClick: (e: google.maps.MapMouseEvent) => void,
  options?: {
    locationMode?: any; 
    setLocationMode?: (mode: any) => void; 
    placeDetailsVisible?: boolean;
    setPlaceDetailsVisible?: (visible: boolean) => void;
    setSelectedPlaceId?: (placeId: string | null) => void;
    setSelectedLocation?: (location: google.maps.LatLng | null) => void;
    setSelectedArea?: (area: Coordinates | null) => void;
    setShowInfoWindow?: (show: boolean) => void;
  }
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
        console.log("Map click from use-map-handlers", e);
        
        // Handle location mode if provided
        if (options?.locationMode === "TRACKING" && options.setLocationMode) {
          options.setLocationMode("OFF");
        }

        // Check if a POI was clicked
        if ((e as any).placeId) {
          // Immediately stop the default POI click behavior
          (e as google.maps.IconMouseEvent).stop();

          // A POI was clicked
          if (options?.setSelectedPlaceId) {
            options.setSelectedPlaceId((e as any).placeId);
          }
          if (options?.setSelectedLocation) {
            options.setSelectedLocation(e.latLng || null);
          }
          if (options?.setPlaceDetailsVisible) {
            options.setPlaceDetailsVisible(true);
          }

          // POI 클릭 시 선택된 영역 초기화하여 그리드 셀 인포윈도우가 표시되지 않도록 함
          if (options?.setSelectedArea) {
            options.setSelectedArea(null);
          }

          // Hide any existing info windows
          if (options?.setShowInfoWindow) {
            options.setShowInfoWindow(false);
          }

          // Prevent grid cell click handling when POI is clicked
          return;
        }

        // Close place details if open
        if (options?.placeDetailsVisible) {
          if (options.setPlaceDetailsVisible) {
            options.setPlaceDetailsVisible(false);
          }
          if (options.setSelectedPlaceId) {
            options.setSelectedPlaceId(null);
          }
          if (options.setSelectedLocation) {
            options.setSelectedLocation(null);
          }
        }

        // Handle grid cell click
        handleGridCellClick(e);
      });
    },
    [drawGrid, showGrid, handleGridCellClick, options]
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
  drawGrid: (mapInstance: google.maps.Map) => void,
  metersPerDegree?: number
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
      }

      // Grid drawing is zoom-gated for performance, but address selection should
      // still work at low zoom levels. Low-zoom clicks use the same snapped cell
      // center and simply skip the visible grid overlay.
      const zoom = mapInstance.getZoom();
      const shouldDrawGrid = isGridVisibleAtZoom(zoom);

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
      const cellCenter = getGridCellCenter(
        clickedLat,
        clickedLng,
        centerLat,
        metersPerDegree
      );

      // Update selected area state
      setSelectedArea(cellCenter);

      // Redraw only when the grid is actually visible at this zoom.
      if (shouldDrawGrid) {
        drawGrid(mapInstance);
      }
    },
    [
      showGrid,
      isGridVisibleAtZoom,
      mapInstanceRef,
      setSelectedArea,
      drawGrid,
      metersPerDegree,
    ]
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
