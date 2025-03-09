import { SupportedLanguage } from "./wordset.js";

export interface Region {
  name: string;
  code: string;
  lat: number;
  long: number;
}

export const findClosestRegion = async (
  {
    lat,
    lng,
  }: {
    lat: number;
    lng: number;
  },
  options?: {
    regionLevel?: number;
    language?: SupportedLanguage;
  }
) => {
  const { regionLevel = 1, language } = options ?? {};

  let regions: Region[] = [];
  try {
    if (regionLevel === 1) {
      // Import region-1 data using the new module system
      regions = // @ts-ignore
        (await import("@repo/geoint/region-dist/region-1.json"))
          .default as Region[];
    } else if (regionLevel == 2) {
      if (!language || language === "English") {
        // Import region-2 data using the new module system
        regions = // @ts-ignore
          (await import("@repo/geoint/region-dist/region-2.json"))
            .default as Region[];
      } else if (language === "Korean") {
        // Import region-2-korean data using the new module system
        regions = // @ts-ignore
          (await import("@repo/geoint/region-dist/region-2-korean.json"))
            .default as Region[];
      } else {
        throw new Error(`Invalid language: ${language}`);
      }
    } else {
      throw new Error(`Invalid region level: ${regionLevel}`);
    }
  } catch (error: unknown) {
    console.error("Error importing region data:", error);
    throw new Error(
      `Failed to load region data for level ${regionLevel}: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  // Find the region that contains the target
  let closestRegion: {
    name: string;
    code: string;
    lat: number;
    lng: number;
  } | null = null;

  let closestRegionDistance = Infinity;

  for (const region of regions) {
    // Calculate the distance between the target point and the region's center
    const distance = calculateDistance(lat, lng, region.lat, region.long);

    // Update the closest region if this one is closer
    if (distance < closestRegionDistance) {
      closestRegionDistance = distance;
      closestRegion = {
        name: region.name,
        code: region.code,
        lat: region.lat,
        lng: region.long,
      };
    }
  }

  return closestRegion;
};

/**
 * Calculates the distance between two points on the Earth's surface using the Haversine formula.
 *
 * @param {number} lat1 - Latitude of the first point in degrees
 * @param {number} lon1 - Longitude of the first point in degrees
 * @param {number} lat2 - Latitude of the second point in degrees
 * @param {number} lon2 - Longitude of the second point in degrees
 * @returns {number} Distance between the points in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  // Earth's radius in kilometers
  const R = 6371;

  // Convert degrees to radians
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  // Haversine formula
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

/**
 * Converts degrees to radians
 *
 * @param {number} degrees - Angle in degrees
 * @returns {number} Angle in radians
 */
export function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}
