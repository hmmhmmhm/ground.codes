import { DEG_PER_METER, GRID_SIZE_METERS } from "./constants";

/**
 * Calculate grid cell size based on latitude (in degrees)
 */
export function calculateGridCellSize(
  latitude: number,
  precisionMeters: number = GRID_SIZE_METERS,
  metersPerDegree: number = DEG_PER_METER
) {
  // Grid size in latitude direction (north-south)
  const latDegreePerCell = precisionMeters / metersPerDegree;
  const latitudeScale = Math.max(
    0.000001,
    Math.abs(Math.cos((latitude * Math.PI) / 180))
  );

  // Grid size in longitude direction (east-west) (adjusted according to latitude)
  const lngDegreePerCell = precisionMeters / (metersPerDegree * latitudeScale);

  return { latDegreePerCell, lngDegreePerCell };
}

/**
 * Get the center coordinates of the grid cell that contains the given point
 */
export function getGridCellCenter(
  lat: number,
  lng: number,
  centerLat: number,
  metersPerDegree: number = DEG_PER_METER
): { lat: number; lng: number } {
  const { latDegreePerCell, lngDegreePerCell } =
    calculateGridCellSize(centerLat, GRID_SIZE_METERS, metersPerDegree);

  // Calculate the grid cell indices
  const latIndex = Math.floor(lat / latDegreePerCell);
  const lngIndex = Math.floor(lng / lngDegreePerCell);

  // Calculate the center of the grid cell
  const centerLatCoord = latIndex * latDegreePerCell + latDegreePerCell / 2;
  const centerLngCoord = lngIndex * lngDegreePerCell + lngDegreePerCell / 2;

  return { lat: centerLatCoord, lng: centerLngCoord };
}
