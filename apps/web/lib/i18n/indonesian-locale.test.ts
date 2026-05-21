import { describe, expect, test } from "bun:test";

import messages from "@/messages/id/index.json";
import placeTypes from "@/messages/id/placeTypes.json";

describe("Indonesian UI locale", () => {
  test("uses Indonesian UI copy", () => {
    expect(messages.common.languageName).toBe("Bahasa Indonesia");
    expect(messages.common.address).toBe("Alamat");
    expect(messages.weather.currentLocation).toBe("Lokasi Saat Ini");
    expect(messages.airQuality.title).toBe("Kualitas Udara");
    expect(placeTypes.bakery).toBe("Toko Roti");
  });
});
