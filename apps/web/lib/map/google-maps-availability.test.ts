import { describe, expect, test } from "bun:test";

import { canConstructGoogleMapsClass } from "./google-maps-availability";

describe("Google Maps API availability", () => {
  test("requires a real constructor instead of only a namespace property", () => {
    expect(canConstructGoogleMapsClass(undefined)).toBe(false);
    expect(canConstructGoogleMapsClass({})).toBe(false);
    expect(canConstructGoogleMapsClass(class InfoWindow {})).toBe(true);
  });
});
