/**
 * 위치 모드 열거형
 */
export enum LocationMode {
  OFF = 'OFF',
  LOCATE = 'LOCATE',
  TRACKING = 'TRACKING',
}

/**
 * 좌표 인터페이스
 */
export interface Coordinates {
  lat: number;
  lng: number;
  accuracy?: number;
  heading?: number | null;
}

/**
 * 마커 인터페이스
 */
export interface Marker {
  id: string;
  position: Coordinates;
  title?: string;
}
