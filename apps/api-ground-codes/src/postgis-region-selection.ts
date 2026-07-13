import {
  type CelestialBody,
  type RegionSearchResult,
  type SupportedLanguage,
  getBodyMetersPerDegree,
  normalizeLongitudeForBody,
} from "ground-codes/src/index.ts";

export type RegionRow = {
  source_index: number;
  name: string;
  code: string;
  lat: number | string;
  lng: number | string;
  body: CelestialBody;
  region_level: number;
  population: number | string | null;
  country_code?: string | null;
  distance_km?: number | string | null;
};

const PROMINENT_REGION_MIN_POPULATION = 1_000_000;
const PROMINENT_REGION_POPULATION_RATIO = 3;
const PROMINENT_REGION_MAX_DISTANCE_KM = 25;
const PROMINENT_REGION_MAX_DISTANCE_RATIO = 1.5;

export const normalizeLookupKey = (value: string) =>
  value
    .replace(/Æ/g, "Ae")
    .replace(/æ/g, "ae")
    .replace(/Œ/g, "Oe")
    .replace(/œ/g, "oe")
    .replace(/Ø/g, "O")
    .replace(/ø/g, "o")
    .replace(/Ð/g, "D")
    .replace(/ð/g, "d")
    .replace(/Þ/g, "Th")
    .replace(/þ/g, "th")
    .replace(/ß/g, "ss")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

export const toRegionSearchResult = (row: RegionRow): RegionSearchResult => ({
  name: row.name,
  code: row.code,
  lat: Number(row.lat),
  lng: Number(row.lng),
  body: row.body,
  regionLevel: row.region_level,
  population: row.population === null ? undefined : Number(row.population),
  distanceKm:
    row.distance_km === null || row.distance_km === undefined
      ? undefined
      : Number(row.distance_km),
});

const toRadians = (degrees: number) => degrees * (Math.PI / 180);

export const calculateDistanceKm = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  body: CelestialBody,
) => {
  const radiusKm = getBodyMetersPerDegree(body) / 1000 / (Math.PI / 180);
  const normalizedLng1 = normalizeLongitudeForBody(lng1, body);
  const normalizedLng2 = normalizeLongitudeForBody(lng2, body);
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(normalizedLng2 - normalizedLng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  return 2 * radiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const selectProminentRegionRow = (
  rows: RegionRow[],
  target: { lat: number; lng: number },
  body: CelestialBody,
) => {
  const candidates = rows.map((row) => ({
    row,
    distanceKm: calculateDistanceKm(
      target.lat,
      target.lng,
      Number(row.lat),
      Number(row.lng),
      body,
    ),
  }));
  const closest = [...candidates].sort(
    (left, right) => left.distanceKm - right.distanceKm,
  )[0];
  if (!closest) return null;

  const closestPopulation =
    closest.row.population === null || closest.row.population === undefined
      ? 0
      : Number(closest.row.population);
  const prominent = [
    ...candidates.filter(
      (candidate) =>
        candidate.row.country_code &&
        candidate.row.country_code === closest.row.country_code &&
        (candidate.row.population === null ||
        candidate.row.population === undefined
          ? 0
          : Number(candidate.row.population)) >=
          PROMINENT_REGION_MIN_POPULATION &&
        (candidate.row.population === null ||
        candidate.row.population === undefined
          ? 0
          : Number(candidate.row.population)) >=
          closestPopulation * PROMINENT_REGION_POPULATION_RATIO &&
        candidate.distanceKm <= PROMINENT_REGION_MAX_DISTANCE_KM &&
        candidate.distanceKm <=
          closest.distanceKm * PROMINENT_REGION_MAX_DISTANCE_RATIO,
    ),
  ].sort((left, right) => {
    const distanceDelta = left.distanceKm - right.distanceKm;
    if (Math.abs(distanceDelta) > 1) return distanceDelta;
    return (
      (right.row.population === null || right.row.population === undefined
        ? 0
        : Number(right.row.population)) -
      (left.row.population === null || left.row.population === undefined
        ? 0
        : Number(left.row.population))
    );
  })[0];

  const selected = prominent ?? closest;
  return { row: selected.row, distanceKm: selected.distanceKm };
};

export const getFallbackSearchLevels = (
  body: CelestialBody,
  regionLevel: number,
) => {
  if (regionLevel !== 2) return [];
  if (body === "mars") return [3];
  if (body === "earth") return [1, 3];
  return [];
};

export const getDatasetName = (
  body: CelestialBody,
  regionLevel: number,
  language: SupportedLanguage | "english",
) => {
  const bodyPart = body === "earth" ? "" : `-${body}`;
  const languagePart = language === "english" ? "" : `-${language}`;
  return `region-${regionLevel}${bodyPart}${languagePart}`;
};
