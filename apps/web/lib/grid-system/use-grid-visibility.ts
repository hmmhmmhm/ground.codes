import { useCallback, useRef } from "react";

/**
 * Hook for grid visibility functionality
 */
export function useGridVisibility() {
  const currentZoomRef = useRef<number | null>(null);
  const gridVisibleRef = useRef<boolean>(false);

  // Check if grid should be visible at current zoom level
  const isGridVisibleAtZoom = useCallback((zoom: number | undefined) => {
    const isVisible = zoom !== undefined && zoom >= 16;
    return isVisible;
  }, []);

  return {
    currentZoomRef,
    gridVisibleRef,
    isGridVisibleAtZoom,
  };
}
