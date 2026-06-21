import { describe, expect, test } from "bun:test";

import faMessages from "@/messages/fa/index.json";
import faPlaceTypes from "@/messages/fa/placeTypes.json";
import guMessages from "@/messages/gu/index.json";
import guPlaceTypes from "@/messages/gu/placeTypes.json";
import knMessages from "@/messages/kn/index.json";
import knPlaceTypes from "@/messages/kn/placeTypes.json";
import mlMessages from "@/messages/ml/index.json";
import mlPlaceTypes from "@/messages/ml/placeTypes.json";
import mrMessages from "@/messages/mr/index.json";
import mrPlaceTypes from "@/messages/mr/placeTypes.json";
import teMessages from "@/messages/te/index.json";
import tePlaceTypes from "@/messages/te/placeTypes.json";
import yoMessages from "@/messages/yo/index.json";
import yoPlaceTypes from "@/messages/yo/placeTypes.json";
import yueMessages from "@/messages/yue/index.json";
import yuePlaceTypes from "@/messages/yue/placeTypes.json";

const localeFixtures = [
  {
    code: "mr",
    languageName: "मराठी",
    messages: mrMessages,
    placeTypes: mrPlaceTypes,
    bakery: "बेकरी",
  },
  {
    code: "te",
    languageName: "తెలుగు",
    messages: teMessages,
    placeTypes: tePlaceTypes,
    bakery: "బేకరీ",
  },
  {
    code: "gu",
    languageName: "ગુજરાતી",
    messages: guMessages,
    placeTypes: guPlaceTypes,
    bakery: "બેકરી",
  },
  {
    code: "kn",
    languageName: "ಕನ್ನಡ",
    messages: knMessages,
    placeTypes: knPlaceTypes,
    bakery: "ಬೇಕರಿ",
  },
  {
    code: "ml",
    languageName: "മലയാളം",
    messages: mlMessages,
    placeTypes: mlPlaceTypes,
    bakery: "ബേക്കറി",
  },
  {
    code: "yo",
    languageName: "Yorùbá",
    messages: yoMessages,
    placeTypes: yoPlaceTypes,
    bakery: "Ilé búrẹ́dì",
  },
  {
    code: "fa",
    languageName: "فارسی",
    messages: faMessages,
    placeTypes: faPlaceTypes,
    bakery: "نانوایی",
  },
  {
    code: "yue",
    languageName: "粵語",
    messages: yueMessages,
    placeTypes: yuePlaceTypes,
    bakery: "麵包店",
  },
];

describe("candidate UI locales", () => {
  test.each(localeFixtures)(
    "$code exposes locale metadata and key place type labels",
    ({ code, languageName, messages, placeTypes, bakery }) => {
      expect(messages.common.languageCode).toBe(code);
      expect(messages.common.languageName).toBe(languageName);
      expect(messages.map.controls.language.length).toBeGreaterThan(0);
      expect(messages.weather.currentLocation.length).toBeGreaterThan(0);
      expect(messages.airQuality.title.length).toBeGreaterThan(0);
      expect(placeTypes.bakery).toBe(bakery);
      expect(placeTypes.tourist_attraction.length).toBeGreaterThan(0);
    },
  );
});
