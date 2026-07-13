import { Client, type ClientConfig } from "pg";
import {
  type CelestialBody,
  type RegionSearchResult,
  type RegionStore,
  type SupportedLanguage,
  setRegionStore,
} from "ground-codes/src/index.ts";
import {
  type RegionRow,
  calculateDistanceKm,
  getDatasetName,
  getFallbackSearchLevels,
  normalizeLookupKey,
  selectProminentRegionRow,
  toRegionSearchResult,
} from "./postgis-region-selection.ts";

type QueryableClient = {
  query<T = Record<string, unknown>>(
    text: string,
    values?: unknown[],
  ): Promise<{ rows: T[] }>;
  connect(): Promise<unknown>;
  end(): Promise<void>;
};

const DEFAULT_REGION_2_FALLBACK_DISTANCE_KM = 100;
const DEFAULT_MARS_REGION_2_FALLBACK_DISTANCE_KM = 100;
const PROMINENT_REGION_CANDIDATE_LIMIT = 50;

export interface PostgisRegionStoreOptions {
  connectionString: string;
  ssl?: ClientConfig["ssl"];
  clientFactory?: (connectionString: string) => QueryableClient;
}

export class PostgisRegionStore implements RegionStore {
  #connectionString: string;
  #clientFactory: (connectionString: string) => QueryableClient;

  constructor({
    connectionString,
    ssl,
    clientFactory = (connectionString) => new Client({ connectionString, ssl }),
  }: PostgisRegionStoreOptions) {
    this.#connectionString = connectionString;
    this.#clientFactory = clientFactory;
  }

  async #withClient<T>(
    callback: (client: QueryableClient) => Promise<T>,
  ): Promise<T> {
    const client = this.#clientFactory(this.#connectionString);
    await client.connect();
    try {
      return await callback(client);
    } finally {
      await client.end();
    }
  }

  async findClosestRegion(
    target: { lat: number; lng: number },
    options?: {
      regionLevel?: number;
      language?: SupportedLanguage;
      region2FallbackDistanceKm?: number;
      body?: CelestialBody;
    },
  ) {
    const body = options?.body ?? "earth";
    const regionLevel = options?.regionLevel ?? (body === "earth" ? 1 : 2);
    const language = options?.language ?? "english";
    const region2FallbackDistanceKm =
      options?.region2FallbackDistanceKm ??
      DEFAULT_REGION_2_FALLBACK_DISTANCE_KM;

    return await this.#withClient(async (client) => {
      const findClosestAtLevel = async (
        candidateRegionLevel: number,
      ): Promise<RegionSearchResult | null> => {
        const candidateLanguage =
          candidateRegionLevel === 1 ? "english" : language;
        const baseDatasetName = getDatasetName(
          body,
          candidateRegionLevel,
          "english",
        );
        const localizedDatasetName = getDatasetName(
          body,
          candidateRegionLevel,
          candidateLanguage,
        );
        const { rows } = await client.query<RegionRow>(
          `
          select
            source_index,
            name,
            code,
            lat,
            lng,
            body,
            region_level,
            population,
            country_code
          from ground_code_regions
          where dataset_name = $3
          order by geom <-> ST_SetSRID(ST_MakePoint($2, $1), 4326)
          limit $4
        `,
          [
            target.lat,
            target.lng,
            baseDatasetName,
            body === "earth" && candidateRegionLevel === 2
              ? PROMINENT_REGION_CANDIDATE_LIMIT
              : 1,
          ],
        );

        const selectedBase = selectProminentRegionRow(rows, target, body);
        if (!selectedBase) return null;
        const baseRow = selectedBase.row;

        let selectedRow = baseRow;
        if (localizedDatasetName !== baseDatasetName) {
          const localized = await client.query<RegionRow>(
            `
              select
                source_index,
                name,
                code,
                lat,
                lng,
                body,
                region_level,
                population,
                country_code
              from ground_code_regions
              where dataset_name = $1
                and code = $2
              limit 1
            `,
            [localizedDatasetName, baseRow.code],
          );
          selectedRow = localized.rows[0] ?? baseRow;
        }

        const region = toRegionSearchResult(selectedRow);
        return {
          ...region,
          distanceKm: selectedBase.distanceKm,
        };
      };

      const closestRegion = await findClosestAtLevel(regionLevel);
      if (!closestRegion) return null;

      if (
        regionLevel !== 2 ||
        closestRegion.distanceKm === undefined ||
        (body === "earth" &&
          closestRegion.distanceKm <= region2FallbackDistanceKm) ||
        (body === "mars" &&
          closestRegion.distanceKm <=
            DEFAULT_MARS_REGION_2_FALLBACK_DISTANCE_KM)
      ) {
        return closestRegion;
      }

      const fallbackCandidates = (
        await Promise.all(
          getFallbackSearchLevels(body, regionLevel).map(findClosestAtLevel),
        )
      ).filter((region): region is RegionSearchResult => Boolean(region));

      return [closestRegion, ...fallbackCandidates].reduce((best, region) =>
        (region.distanceKm ?? Infinity) < (best.distanceKm ?? Infinity)
          ? region
          : best,
      );
    });
  }

  async findRegionsAround(
    target: { lat: number; lng: number },
    options?: {
      regionLevel?: number;
      language?: SupportedLanguage;
      body?: CelestialBody;
      maxResults?: number;
      maxDistance?: number;
    },
  ) {
    const body = options?.body ?? "earth";
    const regionLevel = options?.regionLevel ?? 2;
    const language = options?.language ?? "english";
    const maxResults = options?.maxResults ?? 5;
    const queryLimit = options?.maxDistance
      ? Math.max(maxResults * 20, 100)
      : maxResults;

    return await this.#withClient(async (client) => {
      const { rows } = await client.query<RegionRow>(
        `
          select
            source_index,
            name,
            code,
            lat,
            lng,
            body,
            region_level,
            population,
            country_code
          from ground_code_regions
          where body = $3
            and region_level = $4
            and language = $5
          order by geom <-> ST_SetSRID(ST_MakePoint($2, $1), 4326)
          limit $6
        `,
        [target.lat, target.lng, body, regionLevel, language, queryLimit],
      );

      return rows
        .map((row) => {
          const region = toRegionSearchResult(row);
          return {
            ...region,
            distanceKm: calculateDistanceKm(
              target.lat,
              target.lng,
              region.lat,
              region.lng,
              body,
            ),
          };
        })
        .filter(
          (region) =>
            options?.maxDistance === undefined ||
            (region.distanceKm ?? Infinity) <= options.maxDistance,
        )
        .slice(0, maxResults);
    });
  }

  async findRegionsByQuery(
    codeOrName: string,
    options?: {
      regionLevel?: number;
      language?: SupportedLanguage;
      body?: CelestialBody;
      maxResults?: number;
      biasLat?: number;
      biasLng?: number;
    },
  ) {
    const query = normalizeLookupKey(codeOrName);
    if (!query) return [];

    const body = options?.body ?? "earth";
    const regionLevel = options?.regionLevel ?? 2;
    const language = options?.language ?? "english";
    const maxResults = options?.maxResults ?? 5;
    const hasBias =
      Number.isFinite(options?.biasLat) && Number.isFinite(options?.biasLng);

    return await this.#withClient(async (client) => {
      const seen = new Set<string>();
      const results: RegionSearchResult[] = [];

      const addMatches = async (candidateRegionLevel: number) => {
        const candidateLanguage =
          candidateRegionLevel === 1 ? "english" : language;
        const { rows } = await client.query<RegionRow>(
          `
          select
            source_index,
            name,
            code,
            lat,
            lng,
            body,
            region_level,
            population,
            ${
              hasBias
                ? "ST_DistanceSphere(geom, ST_SetSRID(ST_MakePoint($7, $6), 4326)) / 1000"
                : "null"
            } as distance_km
          from ground_code_regions
          where body = $1
            and region_level = $2
            and language = $3
            and (
              search_code = $4
              or search_name = $4
              or search_code like $5
              or search_name like $5
            )
          order by
            ${hasBias ? "distance_km asc nulls last," : ""}
            case
              when search_code = $4 or search_name = $4 then 0
              when search_name like $4 || '%' then 1
              when search_code like $4 || '%' then 2
              else 3
            end,
            population desc nulls last,
            length(name) asc
          limit $${hasBias ? 8 : 6}
        `,
          hasBias
            ? [
                body,
                candidateRegionLevel,
                candidateLanguage,
                query,
                `%${query}%`,
                options?.biasLat,
                options?.biasLng,
                maxResults,
              ]
            : [
                body,
                candidateRegionLevel,
                candidateLanguage,
                query,
                `%${query}%`,
                maxResults,
              ],
        );

        for (const row of rows) {
          const region = toRegionSearchResult(row);
          const key = `${region.body}:${region.regionLevel}:${region.code}:${region.name}`;
          if (seen.has(key)) continue;
          seen.add(key);
          results.push(region);
          if (results.length >= maxResults) return;
        }
      };

      await addMatches(regionLevel);
      if (results.length >= maxResults) return results;

      for (const fallbackLevel of getFallbackSearchLevels(body, regionLevel)) {
        await addMatches(fallbackLevel);
        if (results.length >= maxResults) return results;
      }

      return results;
    });
  }
}

export const installPostgisRegionStore = (connectionString: string) => {
  const store = new PostgisRegionStore({ connectionString });
  setRegionStore(store);
  return store;
};
