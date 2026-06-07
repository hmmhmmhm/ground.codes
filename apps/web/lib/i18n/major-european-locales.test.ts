import { describe, expect, test } from "bun:test";

import czechMessages from "@/messages/cs/index.json";
import czechPlaceTypes from "@/messages/cs/placeTypes.json";
import greekMessages from "@/messages/el/index.json";
import greekPlaceTypes from "@/messages/el/placeTypes.json";
import italianMessages from "@/messages/it/index.json";
import italianPlaceTypes from "@/messages/it/placeTypes.json";
import dutchMessages from "@/messages/nl/index.json";
import dutchPlaceTypes from "@/messages/nl/placeTypes.json";
import polishMessages from "@/messages/pl/index.json";
import polishPlaceTypes from "@/messages/pl/placeTypes.json";
import romanianMessages from "@/messages/ro/index.json";
import romanianPlaceTypes from "@/messages/ro/placeTypes.json";
import turkishMessages from "@/messages/tr/index.json";
import turkishPlaceTypes from "@/messages/tr/placeTypes.json";
import ukrainianMessages from "@/messages/uk/index.json";
import ukrainianPlaceTypes from "@/messages/uk/placeTypes.json";

const localeFixtures = [
  {
    code: "tr",
    languageName: "Türkçe",
    messages: turkishMessages,
    placeTypes: turkishPlaceTypes,
    bakery: "Fırın",
  },
  {
    code: "it",
    languageName: "Italiano",
    messages: italianMessages,
    placeTypes: italianPlaceTypes,
    bakery: "Panetteria",
  },
  {
    code: "nl",
    languageName: "Nederlands",
    messages: dutchMessages,
    placeTypes: dutchPlaceTypes,
    bakery: "Bakkerij",
  },
  {
    code: "pl",
    languageName: "Polski",
    messages: polishMessages,
    placeTypes: polishPlaceTypes,
    bakery: "Piekarnia",
  },
  {
    code: "uk",
    languageName: "Українська",
    messages: ukrainianMessages,
    placeTypes: ukrainianPlaceTypes,
    bakery: "Пекарня",
  },
  {
    code: "ro",
    languageName: "Română",
    messages: romanianMessages,
    placeTypes: romanianPlaceTypes,
    bakery: "Brutărie",
  },
  {
    code: "cs",
    languageName: "Čeština",
    messages: czechMessages,
    placeTypes: czechPlaceTypes,
    bakery: "Pekařství",
  },
  {
    code: "el",
    languageName: "Ελληνικά",
    messages: greekMessages,
    placeTypes: greekPlaceTypes,
    bakery: "Αρτοποιείο",
  },
];

describe("major European UI locales", () => {
  test.each(localeFixtures)(
    "$code includes localized UI copy and place type labels",
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
