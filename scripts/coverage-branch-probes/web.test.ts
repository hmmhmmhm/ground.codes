import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import {
  GroundCodeApiError,
  encode,
  formatPrecisionMeters,
  searchGroundCodes,
} from "../../apps/web/lib/code/ground-codes.ts";
import {
  buildGroundCodeSharePath,
  parseGroundCodeSharePath,
} from "../../apps/web/lib/code/share-url.ts";
import { getGroundCodeLanguage } from "../../apps/web/lib/i18n/ground-code-language.ts";
import {
  createPlanetaryMapType,
  getDefaultPlanetaryLayerId,
  getDefaultViewForBody,
  getPlanetaryLayerConfig,
  parseCelestialBody,
  parsePlanetaryLayerId,
} from "../../apps/web/lib/map/celestial-bodies.ts";
import { canConstructGoogleMapsClass } from "../../apps/web/lib/map/google-maps-availability.ts";
import {
  installBrowserZoomPrevention,
  shouldPreventBrowserZoom,
} from "../../apps/web/hooks/use-disable-zoom.ts";

const originalFetch = globalThis.fetch;
const originalWarn = console.warn;

afterEach(() => {
  globalThis.fetch = originalFetch;
  console.warn = originalWarn;
  delete process.env.NEXT_PUBLIC_GROUND_CODES_API_URL;
});

test("Web Ground Codes client covers success, fallback, search, and API errors", async () => {
  process.env.NEXT_PUBLIC_GROUND_CODES_API_URL = "https://api.example.test/";
  console.warn = () => undefined;
  let attempt = 0;
  globalThis.fetch = (async () => {
    attempt += 1;
    return attempt === 1
      ? new Response("unavailable", { status: 503 })
      : new Response("Seoul-Happy-Tiger");
  }) as typeof fetch;
  assert.equal(
    await encode({ lat: 37.5, lng: 127, precisionMeters: 3 }),
    "Seoul-Happy-Tiger",
  );

  globalThis.fetch = (async () =>
    Response.json({ query: "Seoul", results: [] })) as typeof fetch;
  assert.deepEqual((await searchGroundCodes({ query: "Seoul" })).results, []);

  globalThis.fetch = (async () =>
    Response.json(
      {
        error: { code: "BAD", message: "bad request", details: { field: "q" } },
      },
      { status: 400 },
    )) as typeof fetch;
  await assert.rejects(
    () => searchGroundCodes({ query: "" }),
    (error) =>
      error instanceof GroundCodeApiError &&
      error.status === 400 &&
      error.code === "BAD",
  );
  assert.equal(formatPrecisionMeters(3), "3m");
  assert.equal(formatPrecisionMeters(3.25), "3.25m");
});

test("share paths and locale selection cover supported and rejected inputs", () => {
  assert.equal(
    buildGroundCodeSharePath({ body: "earth", code: " A-B " }),
    "/A-B",
  );
  assert.equal(
    buildGroundCodeSharePath({ body: "mars", code: " A-B " }),
    "/mars/A-B",
  );
  assert.deepEqual(parseGroundCodeSharePath("/A-B"), {
    body: "earth",
    code: "A-B",
  });
  assert.deepEqual(parseGroundCodeSharePath("/moon/A-B-C"), {
    body: "moon",
    code: "A-B-C",
  });
  assert.equal(parseGroundCodeSharePath("/docs"), null);
  assert.equal(parseGroundCodeSharePath("/moon"), null);
  assert.equal(parseGroundCodeSharePath("/mars/A"), null);
  assert.equal(parseGroundCodeSharePath("/earth/A-B"), null);
  assert.equal(getGroundCodeLanguage("ko"), "korean");
  assert.equal(getGroundCodeLanguage("fr"), "french");
  assert.equal(getGroundCodeLanguage("en"), "english");
});

test("planetary helpers select layers, views, and construct map types", () => {
  assert.equal(parseCelestialBody("moon"), "moon");
  assert.equal(parseCelestialBody("venus"), "earth");
  assert.equal(getDefaultViewForBody("earth").zoom, 18);
  assert.equal(getDefaultViewForBody("mars").zoom, 5);
  assert.equal(getDefaultPlanetaryLayerId("moon"), "KaguyaTC_Ortho");
  assert.equal(getPlanetaryLayerConfig("mars", "missing").id, "MDIM21_color");
  assert.equal(getPlanetaryLayerConfig("mars", "THEMIS")?.id, "THEMIS");
  assert.equal(parsePlanetaryLayerId("moon", "LOLA_bw"), "LOLA_bw");
  assert.equal(parsePlanetaryLayerId("moon", "missing"), "KaguyaTC_Ortho");

  class ImageMapType {
    options: unknown;
    constructor(options: unknown) {
      this.options = options;
    }
  }
  globalThis.google = {
    maps: {
      ImageMapType,
      Size: class Size {
        constructor(
          public width: number,
          public height: number,
        ) {}
      },
    },
  } as typeof google;
  const mapType = createPlanetaryMapType("moon", "LOLA_bw");
  assert.ok(mapType);
  assert.equal(canConstructGoogleMapsClass(ImageMapType), true);
  assert.equal(canConstructGoogleMapsClass({}), false);
});

test("zoom prevention installs active handlers and removes them", () => {
  const listeners = new Map<string, EventListener>();
  const removed: string[] = [];
  const target = {
    addEventListener(type: string, listener: EventListener) {
      listeners.set(type, listener);
    },
    removeEventListener(type: string) {
      removed.push(type);
      listeners.delete(type);
    },
  };
  const cleanup = installBrowserZoomPrevention(target, target);
  let prevented = 0;
  listeners.get("wheel")?.({
    ctrlKey: true,
    preventDefault: () => {
      prevented += 1;
    },
  } as unknown as Event);
  listeners.get("keydown")?.({
    metaKey: true,
    key: "+",
    preventDefault: () => {
      prevented += 1;
    },
  } as unknown as Event);
  assert.equal(prevented, 2);
  assert.equal(shouldPreventBrowserZoom({ touches: { length: 2 } }), true);
  assert.equal(shouldPreventBrowserZoom({ scale: 1 }), false);
  cleanup();
  assert.equal(removed.length, 6);
});
