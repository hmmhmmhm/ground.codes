import {
  type CelestialBody,
  getBodyMetersPerDegree,
  normalizeLongitudeForBody,
} from "./spherical.js";
import type { Region } from "./region-types.js";

const PROMINENT_REGION_MIN_POPULATION = 1_000_000;
const PROMINENT_REGION_POPULATION_RATIO = 3;
const PROMINENT_REGION_MAX_DISTANCE_KM = 25;
const PROMINENT_REGION_MAX_DISTANCE_RATIO = 1.5;

export const findClosestInRegions = (
  target: { lat: number; lng: number },
  regions: Region[],
  regionLevel: number,
  body: CelestialBody,
) => {
  let closestRegion: Region | null = null;
  let closestRegionDistance = Infinity;
  const candidateRegions: Region[] = [];
  const targetLng = normalizeLongitudeForBody(target.lng, body);

  for (const region of regions) {
    const regionLng = normalizeLongitudeForBody(region.long, body);
    const distance = calculateDistance(
      target.lat,
      targetLng,
      region.lat,
      regionLng,
      body,
    );
    const candidate = {
      name: region.name,
      code: region.code,
      lat: region.lat,
      long: regionLng,
      body,
      regionLevel,
      distanceKm: distance,
      population: region.population,
      countryCode: region.countryCode,
    };

    if (distance < closestRegionDistance) {
      closestRegionDistance = distance;
      closestRegion = candidate;
    }
    candidateRegions.push(candidate);
  }

  if (closestRegion && body === "earth" && regionLevel === 2) {
    const closestPopulation = closestRegion.population ?? 0;
    const prominentRegion = candidateRegions
      .filter(
        (region) =>
          region.countryCode &&
          region.countryCode === closestRegion?.countryCode &&
          (region.population ?? 0) >= PROMINENT_REGION_MIN_POPULATION &&
          (region.population ?? 0) >=
            closestPopulation * PROMINENT_REGION_POPULATION_RATIO &&
          (region.distanceKm ?? Infinity) <= PROMINENT_REGION_MAX_DISTANCE_KM &&
          (region.distanceKm ?? Infinity) <=
            closestRegionDistance * PROMINENT_REGION_MAX_DISTANCE_RATIO,
      )
      .sort((left, right) => {
        const distanceDelta = (left.distanceKm ?? 0) - (right.distanceKm ?? 0);
        if (Math.abs(distanceDelta) > 1) return distanceDelta;
        return (right.population ?? 0) - (left.population ?? 0);
      })[0];

    if (prominentRegion) return prominentRegion;
  }

  return closestRegion;
};

export const toRegionResult = (region: Region) => ({
  name: region.name,
  code: region.code,
  lat: region.lat,
  lng: region.long,
  body: region.body,
  regionLevel: region.regionLevel,
  distanceKm: region.distanceKm,
  population: region.population,
});

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  body: CelestialBody = "earth",
): number {
  const radiusKm = getBodyMetersPerDegree(body) / 1000 / (Math.PI / 180);
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return radiusKm * c;
}

export function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}
