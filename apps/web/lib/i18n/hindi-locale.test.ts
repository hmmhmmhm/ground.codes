import { describe, expect, test } from "bun:test";

import messages from "@/messages/hi/index.json";
import placeTypes from "@/messages/hi/placeTypes.json";

describe("Hindi UI locale", () => {
  test("uses Hindi UI copy", () => {
    expect(messages.common.languageName).toBe("हिन्दी");
    expect(messages.common.address).toBe("पता");
    expect(messages.weather.currentLocation).toBe("वर्तमान स्थान");
    expect(messages.airQuality.title).toBe("वायु गुणवत्ता");
    expect(placeTypes.bakery).toBe("बेकरी");
  });
});
