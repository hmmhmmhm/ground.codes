import { describe, expect, test } from "bun:test";

import messages from "@/messages/vi/index.json";
import placeTypes from "@/messages/vi/placeTypes.json";

describe("Vietnamese UI locale", () => {
  test("uses Vietnamese UI copy", () => {
    expect(messages.common.languageName).toBe("Tiếng Việt");
    expect(messages.common.address).toBe("Địa chỉ");
    expect(messages.weather.currentLocation).toBe("Vị trí hiện tại");
    expect(messages.airQuality.title).toBe("Chất lượng không khí");
    expect(placeTypes.bakery).toBe("Tiệm bánh");
  });
});
