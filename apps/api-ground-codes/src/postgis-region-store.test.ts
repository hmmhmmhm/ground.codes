import { describe, expect, test } from "bun:test";
import { setRegionStore } from "ground-codes/src/index.ts";
import {
  calculateDistanceKm,
  getDatasetName,
  getFallbackSearchLevels,
  normalizeLookupKey,
  selectProminentRegionRow,
  toRegionSearchResult,
  type RegionRow,
} from "./postgis-region-selection.js";
import {
  PostgisRegionStore,
  installPostgisRegionStore,
} from "./postgis-region-store.js";

const makeRow = (overrides: Partial<RegionRow> = {}): RegionRow => ({
  source_index: 1,
  name: "Sample",
  code: "sample",
  lat: 0,
  lng: 0,
  body: "earth",
  region_level: 2,
  population: 1_000,
  country_code: "KR",
  ...overrides,
});

const createClient = (responses: Array<RegionRow[] | Error>) => {
  const queries: Array<{ text: string; values?: unknown[] }> = [];
  let connectCount = 0;
  let endCount = 0;

  return {
    queries,
    get connectCount() {
      return connectCount;
    },
    get endCount() {
      return endCount;
    },
    async connect() {
      connectCount += 1;
    },
    async end() {
      endCount += 1;
    },
    async query<T>(text: string, values?: unknown[]) {
      queries.push({ text, values });
      const response = responses.shift() ?? [];
      if (response instanceof Error) throw response;
      return { rows: response as T[] };
    },
  };
};

const createStore = (client: ReturnType<typeof createClient>) =>
  new PostgisRegionStore({
    connectionString: "postgresql://coverage.invalid/database",
    clientFactory: () => client,
  });

describe("PostGIS region selection", () => {
  test("normalizes lookup keys and row values", () => {
    expect(normalizeLookupKey("  Ærø Œuvre Ð Þing Straße  ")).toBe(
      "aero oeuvre d thing strasse",
    );
    expect(
      toRegionSearchResult(
        makeRow({
          lat: "37.5",
          lng: "126.9",
          population: "1200",
          distance_km: "3.5",
        }),
      ),
    ).toMatchObject({
      lat: 37.5,
      lng: 126.9,
      population: 1200,
      distanceKm: 3.5,
    });
    expect(
      toRegionSearchResult(makeRow({ population: null, distance_km: null })),
    ).toMatchObject({ population: undefined, distanceKm: undefined });
  });

  test("calculates wrapped body distances", () => {
    expect(calculateDistanceKm(0, 179, 0, -179, "earth")).toBeCloseTo(222, 0);
    expect(calculateDistanceKm(0, 0, 0, 1, "moon")).toBeCloseTo(30.323, 2);
  });

  test("prefers a nearby prominent region and handles empty input", () => {
    const local = makeRow({
      name: "Local",
      lat: 0.1,
      population: 200_000,
    });
    const metro = makeRow({
      name: "Metro",
      lat: 0.12,
      population: 2_000_000,
    });

    expect(
      selectProminentRegionRow([], { lat: 0, lng: 0 }, "earth"),
    ).toBeNull();
    expect(
      selectProminentRegionRow([local, metro], { lat: 0, lng: 0 }, "earth")?.row
        .name,
    ).toBe("Metro");
    expect(
      selectProminentRegionRow(
        [local, { ...metro, country_code: "US" }],
        { lat: 0, lng: 0 },
        "earth",
      )?.row.name,
    ).toBe("Local");
  });

  test("builds fallback levels and dataset names", () => {
    expect(getFallbackSearchLevels("earth", 2)).toEqual([1, 3]);
    expect(getFallbackSearchLevels("mars", 2)).toEqual([3]);
    expect(getFallbackSearchLevels("moon", 2)).toEqual([]);
    expect(getFallbackSearchLevels("earth", 1)).toEqual([]);
    expect(getDatasetName("earth", 2, "english")).toBe("region-2");
    expect(getDatasetName("moon", 2, "korean")).toBe("region-2-moon-korean");
  });
});

describe("PostGIS region store", () => {
  test("finds and localizes the closest region", async () => {
    const base = makeRow({ code: "seoul", name: "Seoul", lat: 0.1 });
    const localized = makeRow({
      code: "seoul",
      name: "서울",
      lat: 0.1,
    });
    const client = createClient([[base], [localized]]);
    const store = createStore(client);

    await expect(
      store.findClosestRegion(
        { lat: 0, lng: 0 },
        { regionLevel: 2, language: "korean" },
      ),
    ).resolves.toMatchObject({ name: "서울", code: "seoul" });
    expect(client.queries).toHaveLength(2);
    expect(client.queries[0]?.values).toEqual([0, 0, "region-2", 50]);
    expect(client.queries[1]?.values).toEqual(["region-2-korean", "seoul"]);
    expect(client.connectCount).toBe(1);
    expect(client.endCount).toBe(1);
  });

  test("returns null when no closest region exists", async () => {
    const client = createClient([[]]);

    await expect(
      createStore(client).findClosestRegion({ lat: 0, lng: 0 }),
    ).resolves.toBeNull();
    expect(client.endCount).toBe(1);
  });

  test("selects a closer Earth fallback for a distant level-2 result", async () => {
    const client = createClient([
      [makeRow({ name: "Level 2", lat: 5, region_level: 2 })],
      [makeRow({ name: "Level 1", lat: 1, region_level: 1 })],
      [makeRow({ name: "Level 3", lat: 2, region_level: 3 })],
    ]);

    await expect(
      createStore(client).findClosestRegion(
        { lat: 0, lng: 0 },
        { regionLevel: 2 },
      ),
    ).resolves.toMatchObject({ name: "Level 1", regionLevel: 1 });
    expect(client.queries.map((query) => query.values?.[2])).toEqual([
      "region-2",
      "region-1",
      "region-3",
    ]);
  });

  test("keeps nearby and non-level-2 closest results", async () => {
    const nearbyClient = createClient([[makeRow({ lat: 0.01 })]]);
    const levelOneClient = createClient([
      [makeRow({ lat: 5, region_level: 1 })],
    ]);

    await expect(
      createStore(nearbyClient).findClosestRegion(
        { lat: 0, lng: 0 },
        { regionLevel: 2 },
      ),
    ).resolves.toMatchObject({ regionLevel: 2 });
    await expect(
      createStore(levelOneClient).findClosestRegion(
        { lat: 0, lng: 0 },
        { regionLevel: 1 },
      ),
    ).resolves.toMatchObject({ regionLevel: 1 });
    expect(nearbyClient.queries).toHaveLength(1);
    expect(levelOneClient.queries).toHaveLength(1);
  });

  test("filters and limits surrounding regions by computed distance", async () => {
    const client = createClient([
      [
        makeRow({ name: "Near", lat: 0.01 }),
        makeRow({ name: "Far", lat: 5 }),
        makeRow({ name: "Also near", lat: 0.02 }),
      ],
    ]);

    const result = await createStore(client).findRegionsAround(
      { lat: 0, lng: 0 },
      { maxDistance: 10, maxResults: 1, language: "korean" },
    );

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ name: "Near" });
    expect(client.queries[0]?.values).toEqual([
      0,
      0,
      "earth",
      2,
      "korean",
      100,
    ]);
  });

  test("searches normalized queries, deduplicates, and falls back levels", async () => {
    const duplicate = makeRow({ name: "Séoul", code: "seoul" });
    const fallback = makeRow({
      name: "Seoul District",
      code: "seoul-district",
      region_level: 1,
    });
    const client = createClient([[duplicate, duplicate], [fallback]]);

    const result = await createStore(client).findRegionsByQuery("  Séoul  ", {
      maxResults: 3,
    });

    expect(result.map((region) => region.name)).toEqual([
      "Séoul",
      "Seoul District",
    ]);
    expect(client.queries[0]?.values).toEqual([
      "earth",
      2,
      "english",
      "seoul",
      "%seoul%",
      3,
    ]);
    expect(client.queries[1]?.values?.[1]).toBe(1);
  });

  test("uses distance ordering only with a complete finite bias", async () => {
    const client = createClient([[makeRow({ distance_km: 2 })]]);

    await createStore(client).findRegionsByQuery("sample", {
      biasLat: 37.5,
      biasLng: 126.9,
      maxResults: 1,
    });

    expect(client.queries[0]?.text).toContain("ST_DistanceSphere");
    expect(client.queries[0]?.values).toEqual([
      "earth",
      2,
      "english",
      "sample",
      "%sample%",
      37.5,
      126.9,
      1,
    ]);
    const partialBiasClient = createClient([[makeRow()]]);
    await createStore(partialBiasClient).findRegionsByQuery("sample", {
      biasLat: 37.5,
    });
    expect(partialBiasClient.queries[0]?.text).not.toContain(
      "ST_DistanceSphere(geom",
    );
  });

  test("skips the database for empty queries and always closes on failure", async () => {
    const unusedClient = createClient([]);
    await expect(
      createStore(unusedClient).findRegionsByQuery("   "),
    ).resolves.toEqual([]);
    expect(unusedClient.connectCount).toBe(0);

    const failingClient = createClient([new Error("query failed")]);
    await expect(
      createStore(failingClient).findRegionsAround({ lat: 0, lng: 0 }),
    ).rejects.toThrow("query failed");
    expect(failingClient.endCount).toBe(1);
  });

  test("installs a PostGIS store for the runtime", () => {
    try {
      expect(
        installPostgisRegionStore("postgresql://coverage.invalid/db"),
      ).toBeInstanceOf(PostgisRegionStore);
    } finally {
      setRegionStore(null);
    }
  });
});
