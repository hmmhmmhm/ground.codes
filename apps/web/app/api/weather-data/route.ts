import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";
export const maxDuration = 8000;

// Air Quality data interface
export interface AirQualityData {
  dateTime: string;
  regionCode: string;
  indexes: Array<{
    code: string;
    displayName: string;
    aqi: number;
    aqiDisplay: string;
    color: string;
    category: string;
    dominantPollutant: string;
  }>;
  pollutants?: Array<{
    code: string;
    displayName: string;
    fullName: string;
    concentration: {
      value: number;
      units: string;
    };
  }>;
  healthRecommendations?: {
    generalPopulation: string;
    children: string;
    elderly: string;
    sportsAndRecreation: string;
    [key: string]: string;
  };
}

// Weather data interface
export interface WeatherData {
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
  };
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  wind: {
    speed: number;
    deg: number;
  };
  name: string;
}

// Combined response interface
export interface CombinedWeatherData {
  airQuality: AirQualityData | null;
  weather: WeatherData | null;
  error?: string;
  unavailable?: boolean;
}

type WeatherEnvKey = "GOOGLE_MAPS_NODEJS_API_KEY" | "OPENWEATHER_API_KEY";

const getOptionalWeatherEnv = (key: WeatherEnvKey): string | undefined =>
  process.env[key];

/**
 * API route to fetch both air quality and weather data
 * This keeps the API keys secure on the server side
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lat, lng, language = "en" } = body;

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json(
        { error: "Latitude and longitude are required" },
        { status: 400 }
      );
    }

    // Access API keys securely from server environment
    const googleMapsApiKey = getOptionalWeatherEnv("GOOGLE_MAPS_NODEJS_API_KEY");
    const openWeatherApiKey = getOptionalWeatherEnv("OPENWEATHER_API_KEY");

    if (!googleMapsApiKey || !openWeatherApiKey) {
      return NextResponse.json({
        airQuality: null,
        weather: null,
        unavailable: true,
      });
    }

    // Map the language code to supported languages for each API
    // OpenWeatherMap supports more languages than Google Air Quality API
    // For Air Quality API, fallback to closest supported language
    const airQualityLanguageMap: { [key: string]: string } = {
      en: "en",
      ko: "ko",
      cn: "zh-CN",
      es: "es",
    };

    // Get the appropriate language code for Air Quality API
    const airQualityLanguage = airQualityLanguageMap[language] || "en";

    // Map the language code to supported languages for each API
    // OpenWeatherMap supports more languages than Google Air Quality API
    // For Air Quality API, fallback to closest supported language
    const weatherLanguageMap: { [key: string]: string } = {
      en: "en",
      ko: "kr",
      cn: "zh-cn",
      es: "es",
    };
    const weatherLanguage = weatherLanguageMap[language] || "en";

    // Fetch both air quality and weather data in parallel
    const [airQualityResponse, weatherResponse] = await Promise.allSettled([
      // Air Quality API request
      fetch(
        `https://airquality.googleapis.com/v1/currentConditions:lookup?key=${googleMapsApiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            location: {
              latitude: lat,
              longitude: lng,
            },
            extraComputations: [
              "POLLUTANT_CONCENTRATION",
              "HEALTH_RECOMMENDATIONS",
            ],
            languageCode: airQualityLanguage, // Use the mapped language code
          }),
        }
      ).then((res) => {
        if (!res.ok) throw new Error(`Air Quality API error: ${res.status}`);
        return res.json();
      }),

      // Weather API request
      fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&lang=${weatherLanguage}&appid=${openWeatherApiKey}`
      ).then((res) => {
        if (!res.ok) throw new Error(`Weather API error: ${res.status}`);
        return res.json();
      }),
    ]);

    // Prepare the combined response
    const response: CombinedWeatherData = {
      airQuality: null,
      weather: null,
    };

    // Handle air quality data
    if (airQualityResponse.status === "fulfilled") {
      response.airQuality = airQualityResponse.value;
    } else if (airQualityResponse.status === "rejected") {
      console.error(
        "Air quality data fetch failed:",
        airQualityResponse.reason
      );
    }

    // Handle weather data
    if (weatherResponse.status === "fulfilled") {
      response.weather = weatherResponse.value;
    } else if (weatherResponse.status === "rejected") {
      console.error("Weather data fetch failed:", weatherResponse.reason);
    }

    // If both failed, return an error
    if (
      airQualityResponse.status === "rejected" &&
      weatherResponse.status === "rejected"
    ) {
      return NextResponse.json(
        {
          error: "Failed to fetch weather and air quality data",
          airQuality: null,
          weather: null,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching weather data:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch weather data",
        airQuality: null,
        weather: null,
      },
      { status: 500 }
    );
  }
}
