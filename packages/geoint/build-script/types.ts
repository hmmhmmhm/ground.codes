export interface RegionData {
  name: string;
  code: string;
  lat: number;
  long: number;
  population?: number;
  countryCode?: string;
  body?: "earth" | "moon" | "mars";
  featureType?: string;
  diameterKm?: number;
  source?: string;
}
