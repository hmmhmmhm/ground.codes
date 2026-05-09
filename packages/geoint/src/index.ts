import KDBush from "kdbush";
import * as geokdbush from "geokdbush";
import fs from "fs";
import path from "path";
import { Level } from "level";

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

export const regionIndexes: Record<string, any> = {};
export const regionLevels: Record<string, any> = {};

export const load = async (loadRegions: string[] = []) => {
  const dbPath = new URL("../region-db", import.meta.url).pathname;

  const files = fs
    .readdirSync(dbPath)
    .filter((file) => file.endsWith(".index"));

  for (const file of files) {
    const regionName = file.replace(".index", "");
    if (loadRegions.length > 0 && !loadRegions.includes(regionName)) continue;

    const filePath = path.join(dbPath, file);
    const index = KDBush.from(fs.readFileSync(filePath).buffer);
    regionIndexes[regionName] = index;

    const level = new Level(path.join(dbPath, regionName));
    await level.open();
    regionLevels[regionName] = level;
  }
};

export const unload = async (unloadRegions: string[] = []) => {
  for (const regionName in regionLevels) {
    if (unloadRegions.length > 0 && !unloadRegions.includes(regionName))
      continue;
    await regionLevels[regionName].close();
    delete regionLevels[regionName];
  }
  for (const regionName in regionIndexes) {
    if (unloadRegions.length > 0 && !unloadRegions.includes(regionName))
      continue;
    delete regionIndexes[regionName];
  }
};

export const around = async ({
  regionName,
  lat,
  lng,
  maxResults,
  maxDistance,
}: {
  regionName: string;
  lat: number;
  lng: number;
  maxResults?: number;
  maxDistance?: number;
}) => {
  const index = regionIndexes[regionName];
  if (!index) {
    throw new Error(`Index not found for region: ${regionName}`);
  }
  const nearestIds: number[] = geokdbush.around(
    index,
    lng,
    lat,
    maxResults,
    maxDistance,
  );

  const results: RegionData[] = [];
  for (const id of nearestIds)
    results.push(JSON.parse(await regionLevels[regionName].get(`I-${id}`)));

  return results;
};

export const info = async ({
  regionName,
  name,
}: {
  regionName: string;
  name: string;
}) => {
  const index = (await regionLevels[regionName].get(`N-${name}`)) as string;
  return JSON.parse(await regionLevels[regionName].get(index)) as RegionData;
};
