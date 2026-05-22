import { describe, expect, test } from "bun:test";

import messages from "@/messages/th/index.json";
import placeTypes from "@/messages/th/placeTypes.json";

describe("Thai UI locale", () => {
  test("uses Thai UI copy", () => {
    expect(messages.common.languageName).toBe("ไทย");
    expect(messages.common.address).toBe("ที่อยู่");
    expect(messages.weather.currentLocation).toBe("ตำแหน่งปัจจุบัน");
    expect(messages.airQuality.title).toBe("คุณภาพอากาศ");
    expect(placeTypes.bakery).toBe("ร้านเบเกอรี่");
  });
});
