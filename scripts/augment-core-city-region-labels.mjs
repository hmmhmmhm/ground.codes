import { createWriteStream } from "node:fs";
import { mkdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { pipeline } from "node:stream/promises";
import { get } from "node:https";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");
const regionDist = resolve(repoRoot, "packages/geoint/region-dist");
const cacheDir = resolve(repoRoot, ".cache/geonames");
const cities500Url = "https://download.geonames.org/export/dump/cities500.zip";
const execFileAsync = promisify(execFile);

const CORE_COUNTRY_CITY_LIMIT = 10;
const CORE_FEATURE_CODES = new Set(["PPLC", "PPLA"]);

const download = (url, destination) =>
  new Promise((resolveDownload, rejectDownload) => {
    get(url, (response) => {
      if (
        response.statusCode &&
        response.statusCode >= 300 &&
        response.statusCode < 400 &&
        response.headers.location
      ) {
        download(response.headers.location, destination)
          .then(resolveDownload)
          .catch(rejectDownload);
        return;
      }

      if (response.statusCode !== 200) {
        rejectDownload(
          new Error(`Failed to download ${url}: HTTP ${response.statusCode}`),
        );
        return;
      }

      pipeline(response, createWriteStream(destination))
        .then(resolveDownload)
        .catch(rejectDownload);
    }).on("error", rejectDownload);
  });

const pathExists = async (path) => {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
};

const ensureCities500 = async () => {
  if (process.env.GEONAMES_CITIES500) return process.env.GEONAMES_CITIES500;

  await mkdir(cacheDir, { recursive: true });
  const citiesPath = resolve(cacheDir, "cities500.txt");
  if (await pathExists(citiesPath)) return citiesPath;

  const zipPath = resolve(cacheDir, "cities500.zip");
  await download(cities500Url, zipPath);
  await execFileAsync("unzip", ["-p", zipPath, "cities500.txt"], {
    maxBuffer: 64 * 1024 * 1024,
  }).then(({ stdout }) => writeFile(citiesPath, stdout, "utf8"));
  return citiesPath;
};

const cleanCityName = (name) => name.replace(/-dong$/, "").replace("-", "");

const parseCities500 = (content) => {
  const rows = [];
  for (const line of content.split("\n")) {
    if (!line.trim()) continue;
    const columns = line.split("\t");
    if (columns.length < 19) continue;

    const [
      geonameId,
      name,
      asciiName,
      _alternateNamesRaw,
      latitude,
      longitude,
      _featureClass,
      featureCode,
      countryCode,
      _cc2,
      _admin1Code,
      _admin2Code,
      _admin3Code,
      _admin4Code,
      population,
    ] = columns;

    const cityName = cleanCityName(asciiName || name || "");
    const lat = Number(latitude);
    const long = Number(longitude);
    if (!cityName || !Number.isFinite(lat) || !Number.isFinite(long)) continue;

    rows.push({
      name: cityName,
      code: geonameId,
      lat,
      long,
      population: Number(population || 0) || 0,
      countryCode,
      featureCode,
    });
  }
  return rows;
};

const selectCoreCityRows = (rows) => {
  const selected = new Map();
  const byCountry = new Map();

  for (const row of rows) {
    if (!byCountry.has(row.countryCode)) byCountry.set(row.countryCode, []);
    byCountry.get(row.countryCode).push(row);
    if (CORE_FEATURE_CODES.has(row.featureCode)) selected.set(row.code, row);
  }

  for (const countryRows of byCountry.values()) {
    countryRows
      .toSorted((left, right) => right.population - left.population)
      .slice(0, CORE_COUNTRY_CITY_LIMIT)
      .forEach((row) => selected.set(row.code, row));
  }

  return [...selected.values()].toSorted((left, right) =>
    left.countryCode === right.countryCode
      ? right.population - left.population
      : left.countryCode.localeCompare(right.countryCode),
  );
};

const createCoreCityPlan = (regions, coreRows, previouslyAddedCodes) => {
  const existingCodes = new Set(regions.map((region) => String(region.code)));
  const existingNames = new Map();
  for (const region of regions) {
    existingNames.set(region.name, (existingNames.get(region.name) ?? 0) + 1);
  }

  const additions = [];
  const candidates = [];
  for (const row of coreRows) {
    const alreadyPresent = existingCodes.has(String(row.code));
    if (alreadyPresent) {
      candidates.push({
        ...row,
        finalName: regions.find((region) => String(region.code) === row.code)
          ?.name,
        status: previouslyAddedCodes.has(String(row.code))
          ? "added"
          : "present",
      });
      continue;
    }

    let name = row.name;
    if (existingNames.has(name)) name = `${name} ${row.countryCode}`;
    existingNames.set(name, (existingNames.get(name) ?? 0) + 1);

    additions.push({
      name,
      code: row.code,
      lat: row.lat,
      long: row.long,
      population: row.population,
      countryCode: row.countryCode,
    });
    candidates.push({
      ...row,
      finalName: name,
      status: "added",
    });
  }

  return { regions: [...regions, ...additions], additions, candidates };
};

const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));

const writeJson = async (path, value) => {
  const temporaryPath = `${path}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(temporaryPath, path);
};

const main = async () => {
  const citiesPath = await ensureCities500();
  const rows = parseCities500(await readFile(citiesPath, "utf8"));
  const coreRows = selectCoreCityRows(rows);
  const basePath = resolve(regionDist, "region-2.json");
  const auditPath = resolve(
    repoRoot,
    "packages/geoint/region-dataset/core-city-region-label-audit.json",
  );
  const previousAudit = (await pathExists(auditPath))
    ? await readJson(auditPath)
    : { labels: [] };
  const previouslyAddedCodes = new Set(
    (previousAudit.labels ?? [])
      .filter((label) => label.status === "added" || !label.status)
      .map((label) => String(label.code)),
  );
  const baseRegions = await readJson(basePath);
  const {
    regions: nextBaseRegions,
    additions,
    candidates,
  } = createCoreCityPlan(baseRegions, coreRows, previouslyAddedCodes);

  if (additions.length > 0) {
    await writeJson(basePath, nextBaseRegions);
  }

  await writeJson(auditPath, {
    source: "GeoNames cities500",
    sourceUrl: cities500Url,
    countryTopN: CORE_COUNTRY_CITY_LIMIT,
    featureCodes: [...CORE_FEATURE_CODES],
    candidates: candidates.length,
    alreadyPresent: candidates.filter(
      (candidate) => candidate.status === "present",
    ).length,
    additions:
      additions.length +
      candidates.filter((candidate) => candidate.status === "added").length,
    labels: candidates,
  });

  await rm(resolve(cacheDir, "cities500.zip"), { force: true });

  console.log(
    `Added ${additions.length} core city labels to canonical Earth region-2.`,
  );
};

await main();
