import { afterEach, describe, expect, test } from "bun:test";
import { NextRequest } from "next/server";
import { POST } from "./route";

const originalGoogleKey = process.env.GOOGLE_MAPS_NODEJS_API_KEY;
const originalOpenWeatherKey = process.env.OPENWEATHER_API_KEY;

afterEach(() => {
  if (originalGoogleKey === undefined) {
    delete process.env.GOOGLE_MAPS_NODEJS_API_KEY;
  } else {
    process.env.GOOGLE_MAPS_NODEJS_API_KEY = originalGoogleKey;
  }

  if (originalOpenWeatherKey === undefined) {
    delete process.env.OPENWEATHER_API_KEY;
  } else {
    process.env.OPENWEATHER_API_KEY = originalOpenWeatherKey;
  }
});

describe("weather data API", () => {
  test("reports missing optional API keys without a server error", async () => {
    delete process.env.GOOGLE_MAPS_NODEJS_API_KEY;
    delete process.env.OPENWEATHER_API_KEY;

    const response = await POST(
      new NextRequest("http://localhost/api/weather-data", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          lat: 37.566,
          lng: 126.978,
          language: "ko",
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      airQuality: null,
      weather: null,
      unavailable: true,
    });
  });

  test("accepts zero latitude and longitude as valid coordinates", async () => {
    delete process.env.GOOGLE_MAPS_NODEJS_API_KEY;
    delete process.env.OPENWEATHER_API_KEY;

    const response = await POST(
      new NextRequest("http://localhost/api/weather-data", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          lat: 0,
          lng: 0,
          language: "en",
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      unavailable: true,
    });
  });
});
