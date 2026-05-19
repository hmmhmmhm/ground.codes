import { describe, expect, test } from "bun:test";
import { shouldRequestPlacePredictions } from "./map-search-state";

describe("map search state", () => {
  test("does not request Google place predictions outside Earth place search", () => {
    expect(
      shouldRequestPlacePredictions({
        isPlacePredictionEnabled: false,
        isGroundSearchLoading: false,
        trimmedQuery: "Seo",
        normalizedQuery: "seo",
        suppressedPredictionQuery: null,
      }),
    ).toBe(false);
  });

  test("requests place predictions only for active Earth place input", () => {
    expect(
      shouldRequestPlacePredictions({
        isPlacePredictionEnabled: true,
        isGroundSearchLoading: false,
        trimmedQuery: "Seo",
        normalizedQuery: "seo",
        suppressedPredictionQuery: null,
      }),
    ).toBe(true);

    expect(
      shouldRequestPlacePredictions({
        isPlacePredictionEnabled: true,
        isGroundSearchLoading: false,
        trimmedQuery: "S",
        normalizedQuery: "s",
        suppressedPredictionQuery: null,
      }),
    ).toBe(false);
  });
});
