import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  decode,
  encode,
  findRegionsByQuery,
  setRegionStore,
  type RegionStore,
} from "../src/index.js";

const seoulStore: RegionStore = {
  async findClosestRegion() {
    return {
      name: "Seoul",
      code: "KR-SEL",
      lat: 37.566,
      lng: 126.978,
      body: "earth",
      regionLevel: 2,
    };
  },
  async findRegionsByQuery(query, options) {
    if (query !== "Seoul") return [];
    return [
      {
        name: "Seoul",
        code: "KR-SEL",
        lat: 37.566,
        lng: 126.978,
        body: options?.body ?? "earth",
        regionLevel: options?.regionLevel ?? 2,
      },
    ];
  },
};

describe("region store injection", () => {
  afterEach(() => {
    setRegionStore(null);
  });

  it("uses the configured store when encoding and decoding region-backed codes", async () => {
    setRegionStore(seoulStore);

    const encoded = await encode(
      { lat: 37.5661, lng: 126.9781 },
      { language: "english", regionLevel: 2 },
    );
    assert.match(encoded, /^Seoul-/);

    const decoded = await decode(encoded, {
      language: "english",
      regionLevel: 2,
    });
    assert.ok(Math.abs(decoded.lat - 37.5661) < 0.001);
    assert.ok(Math.abs(decoded.lng - 126.9781) < 0.001);
  });

  it("routes direct region search through the configured store", async () => {
    setRegionStore(seoulStore);

    assert.deepEqual(await findRegionsByQuery("Seoul", { regionLevel: 2 }), [
      {
        name: "Seoul",
        code: "KR-SEL",
        lat: 37.566,
        lng: 126.978,
        body: "earth",
        regionLevel: 2,
      },
    ]);
  });
});
