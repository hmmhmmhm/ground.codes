import type { CelestialBody } from "./spherical.js";
import type { SupportedLanguage } from "./wordset.js";

export interface Region {
  name: string;
  code: string;
  lat: number;
  long: number;
  body?: CelestialBody;
  regionLevel?: number;
  distanceKm?: number;
  population?: number;
  countryCode?: string;
}

export interface RegionSearchResult {
  lat: number;
  lng: number;
  regionLevel?: number;
  body?: CelestialBody;
  name: string;
  code: string;
  distanceKm?: number;
  population?: number;
}

export interface RegionStore {
  findRegionsAround?(
    target: { lat: number; lng: number },
    options?: {
      regionLevel?: number;
      language?: SupportedLanguage;
      body?: CelestialBody;
      maxResults?: number;
      maxDistance?: number;
    },
  ): Promise<RegionSearchResult[]>;
  findClosestRegion(
    target: { lat: number; lng: number },
    options?: {
      regionLevel?: number;
      language?: SupportedLanguage;
      region2FallbackDistanceKm?: number;
      body?: CelestialBody;
    },
  ): Promise<RegionSearchResult | null>;
  findRegionsByQuery(
    codeOrName: string,
    options?: {
      regionLevel?: number;
      language?: SupportedLanguage;
      body?: CelestialBody;
      maxResults?: number;
      biasLat?: number;
      biasLng?: number;
    },
  ): Promise<RegionSearchResult[]>;
}
