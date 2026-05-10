import { DEG_PER_METER, GRID_SIZE_METERS } from "./constants";

const MAX_GRID_LINES = 150;
const MAX_GRID_PRECISION_STEPS = 24;

type GridBoundsMetrics = {
  precisionMeters: number;
  latDegreePerCell: number;
  lngDegreePerCell: number;
  startLat: number;
  endLat: number;
  startLng: number;
  endLng: number;
  latLines: number;
  lngLines: number;
};

/**
 * Calculate grid cell size based on latitude (in degrees)
 */
export function calculateGridCellSize(
  latitude: number,
  precisionMeters: number = GRID_SIZE_METERS,
  metersPerDegree: number = DEG_PER_METER,
) {
  // Grid size in latitude direction (north-south)
  const latDegreePerCell = precisionMeters / metersPerDegree;
  const latitudeScale = Math.max(
    0.000001,
    Math.abs(Math.cos((latitude * Math.PI) / 180)),
  );

  // Grid size in longitude direction (east-west) (adjusted according to latitude)
  const lngDegreePerCell = precisionMeters / (metersPerDegree * latitudeScale);

  return { latDegreePerCell, lngDegreePerCell };
}

export function calculateGridBoundsMetrics(
  bounds: google.maps.LatLngBounds,
  centerLat: number,
  precisionMeters: number = GRID_SIZE_METERS,
  metersPerDegree: number = DEG_PER_METER,
): GridBoundsMetrics {
  const ne = bounds.getNorthEast();
  const sw = bounds.getSouthWest();
  const { latDegreePerCell, lngDegreePerCell } = calculateGridCellSize(
    centerLat,
    precisionMeters,
    metersPerDegree,
  );
  const startLat = Math.floor(sw.lat() / latDegreePerCell) * latDegreePerCell;
  const endLat = Math.ceil(ne.lat() / latDegreePerCell) * latDegreePerCell;
  const startLng = Math.floor(sw.lng() / lngDegreePerCell) * lngDegreePerCell;
  const endLng = Math.ceil(ne.lng() / lngDegreePerCell) * lngDegreePerCell;
  const latLines = Math.round((endLat - startLat) / latDegreePerCell) + 1;
  const lngLines = Math.round((endLng - startLng) / lngDegreePerCell) + 1;

  return {
    precisionMeters,
    latDegreePerCell,
    lngDegreePerCell,
    startLat,
    endLat,
    startLng,
    endLng,
    latLines,
    lngLines,
  };
}

export function chooseVisibleGridMetrics(
  bounds: google.maps.LatLngBounds,
  centerLat: number,
  metersPerDegree: number = DEG_PER_METER,
  basePrecisionMeters: number = GRID_SIZE_METERS,
  maxLines: number = MAX_GRID_LINES,
): GridBoundsMetrics {
  let precisionMeters = basePrecisionMeters;

  for (let i = 0; i < MAX_GRID_PRECISION_STEPS; i++) {
    const metrics = calculateGridBoundsMetrics(
      bounds,
      centerLat,
      precisionMeters,
      metersPerDegree,
    );

    if (metrics.latLines <= maxLines && metrics.lngLines <= maxLines) {
      return metrics;
    }

    precisionMeters *= 2;
  }

  return calculateGridBoundsMetrics(
    bounds,
    centerLat,
    precisionMeters,
    metersPerDegree,
  );
}

/**
 * Get the center coordinates of the grid cell that contains the given point
 */
export function getGridCellCenter(
  lat: number,
  lng: number,
  centerLat: number,
  metersPerDegree: number = DEG_PER_METER,
): { lat: number; lng: number } {
  const { latDegreePerCell, lngDegreePerCell } = calculateGridCellSize(
    centerLat,
    GRID_SIZE_METERS,
    metersPerDegree,
  );

  // Calculate the grid cell indices
  const latIndex = Math.floor(lat / latDegreePerCell);
  const lngIndex = Math.floor(lng / lngDegreePerCell);

  // Calculate the center of the grid cell
  const centerLatCoord = latIndex * latDegreePerCell + latDegreePerCell / 2;
  const centerLngCoord = lngIndex * lngDegreePerCell + lngDegreePerCell / 2;

  return { lat: centerLatCoord, lng: centerLngCoord };
}
