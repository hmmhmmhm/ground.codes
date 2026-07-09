import { describe, expect, test } from "bun:test";
import { PLANETARY_LANDMARK_LABELS } from "./celestial-bodies";
import { PLANETARY_LANDMARK_LOCALIZED_LABELS } from "./planetary-landmark-labels";

describe("planetary landmark labels", () => {
  test("keeps a compact global orientation set for each planetary body", () => {
    for (const [body, landmarks] of Object.entries(PLANETARY_LANDMARK_LABELS)) {
      expect(landmarks.length).toBeGreaterThanOrEqual(
        body === "moon" ? 20 : 18,
      );
      expect(landmarks.length).toBeLessThanOrEqual(24);

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
    ).toEqual(
      expect.arrayContaining([
        "Mare Imbrium",
        "Tycho",
        "Apollo 11",
        "Mare Moscoviense",
        "Korolev",
      ]),
    );
    expect(
      PLANETARY_LANDMARK_LABELS.mars.map((landmark) => landmark.name),
    ).toEqual(
      expect.arrayContaining([
        "Olympus Mons",
        "Valles Marineris",
        "Jezero Crater",
        "Amazonis Planitia",
        "Isidis Planitia",
      ]),
    );
  });

  test("provides localized landmark labels for active UI languages", () => {
    expect(
      PLANETARY_LANDMARK_LOCALIZED_LABELS.korean.moon?.["mare-tranquillitatis"],
    ).toBe("고요의 바다");
    expect(
      PLANETARY_LANDMARK_LOCALIZED_LABELS.korean.moon?.["mare-moscoviense"],
    ).toBe("모스크바의 바다");
    expect(PLANETARY_LANDMARK_LOCALIZED_LABELS.korean.moon?.korolev).toBe(
      "코롤료프 크레이터",
    );
    expect(PLANETARY_LANDMARK_LOCALIZED_LABELS.korean.moon?.["apollo-11"]).toBe(
      "아폴로 11",
    );
    expect(
      PLANETARY_LANDMARK_LOCALIZED_LABELS.korean.mars?.["olympus-mons"],
    ).toBe("올림푸스 산");
    expect(
      PLANETARY_LANDMARK_LOCALIZED_LABELS.korean.mars?.["jezero-crater"],
    ).toBe("예제로 크레이터");
    expect(
      PLANETARY_LANDMARK_LOCALIZED_LABELS.chinese.mars?.["jezero-crater"],
    ).toBe("耶泽罗撞击坑");
    expect(
      PLANETARY_LANDMARK_LOCALIZED_LABELS.japanese.moon?.["mare-moscoviense"],
    ).toBe("モスクワの海");
    expect(
      PLANETARY_LANDMARK_LOCALIZED_LABELS.french.mars?.["olympus-mons"],
    ).toBe("Mont Olympe");
    expect(
      PLANETARY_LANDMARK_LOCALIZED_LABELS.german.moon?.["mare-imbrium"],
    ).toBe("Regenmeer");
    expect(
      PLANETARY_LANDMARK_LOCALIZED_LABELS.portuguese.mars?.["valles-marineris"],
    ).toBe("Vales Marineris");
    expect(
      PLANETARY_LANDMARK_LOCALIZED_LABELS.indonesian.moon?.[
        "oceanus-procellarum"
      ],
    ).toBe("Samudra Badai");
    expect(
      PLANETARY_LANDMARK_LOCALIZED_LABELS.thai.mars?.["hellas-planitia"],
    ).toBe("ที่ราบเฮลลัส");
    expect(
      PLANETARY_LANDMARK_LOCALIZED_LABELS.vietnamese.moon?.["mare-imbrium"],
    ).toBe("Biển Mưa");
    expect(
      PLANETARY_LANDMARK_LOCALIZED_LABELS.hindi.mars?.["olympus-mons"],
    ).toBe("ओलिम्पस पर्वत");
    expect(
      PLANETARY_LANDMARK_LOCALIZED_LABELS.arabic.moon?.["oceanus-procellarum"],
    ).toBe("محيط العواصف");
    expect(
      PLANETARY_LANDMARK_LOCALIZED_LABELS.russian.mars?.["jezero-crater"],
    ).toBe("кратер Езеро");
  });
});
