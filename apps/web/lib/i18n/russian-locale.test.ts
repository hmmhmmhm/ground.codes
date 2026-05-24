import { describe, expect, test } from "bun:test";

import messages from "@/messages/ru/index.json";
import placeTypes from "@/messages/ru/placeTypes.json";

describe("Russian UI locale", () => {
  test("uses Russian UI copy", () => {
    expect(messages.common.languageName).toBe("Русский");
    expect(messages.common.address).toBe("Адрес");
    expect(messages.weather.currentLocation).toBe("Текущее местоположение");
    expect(messages.airQuality.title).toBe("Качество воздуха");
    expect(placeTypes.bakery).toBe("Пекарня");
  });
});
