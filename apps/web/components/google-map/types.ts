/**
 * Location mode enum
 */
export enum LocationMode {
  OFF = "OFF",
  LOCATE = "LOCATE",
  TRACKING = "TRACKING",
}

/**
 * Coordinate interface
 */
export interface Coordinates {
  lat: number;
  lng: number;
  accuracy?: number;
  heading?: number | null;
}

/**
 * Marker interface
 */
export interface Marker {
  id: string;
  position: Coordinates;
  title?: string;
}
