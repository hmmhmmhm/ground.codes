import { describe, expect, test } from "bun:test";
import { PLANETARY_LANDMARK_LABELS } from "./celestial-bodies";

describe("planetary landmark labels", () => {
  test("keeps a compact global orientation set for each planetary body", () => {
    for (const [body, landmarks] of Object.entries(PLANETARY_LANDMARK_LABELS)) {
      expect(landmarks.length).toBeGreaterThanOrEqual(10);
      expect(landmarks.length).toBeLessThanOrEqual(12);

      const ids = new Set(landmarks.map((landmark) => landmark.id));
      const names = new Set(landmarks.map((landmark) => landmark.name));
      expect(ids.size).toBe(landmarks.length);
      expect(names.size).toBe(landmarks.length);

      for (const landmark of landmarks) {
        expect(
          landmark.lat,
          `${body}:${landmark.id} latitude`,
        ).toBeGreaterThanOrEqual(-90);
        expect(
          landmark.lat,
          `${body}:${landmark.id} latitude`,
        ).toBeLessThanOrEqual(90);
        expect(
          landmark.lng,
          `${body}:${landmark.id} longitude`,
        ).toBeGreaterThanOrEqual(-180);
        expect(
          landmark.lng,
          `${body}:${landmark.id} longitude`,
        ).toBeLessThanOrEqual(180);
      }
    }
  });

  test("includes recognizable low-zoom anchors for the Moon and Mars", () => {
    expect(
      PLANETARY_LANDMARK_LABELS.moon.map((landmark) => landmark.name),
    ).toEqual(expect.arrayContaining(["Mare Imbrium", "Tycho", "Apollo 11"]));
    expect(
      PLANETARY_LANDMARK_LABELS.mars.map((landmark) => landmark.name),
    ).toEqual(
      expect.arrayContaining([
        "Olympus Mons",
        "Valles Marineris",
        "Jezero Crater",
      ]),
    );
  });
});
