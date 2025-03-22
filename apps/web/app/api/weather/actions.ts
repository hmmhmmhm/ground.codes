"use server";

import { Coordinates } from "@/components/google-map/types";

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

/**
 * Server action to fetch weather data from OpenWeatherMap API
 * This keeps the API key secure on the server side
 */
export async function fetchWeatherData(
  coordinates: Coordinates
): Promise<WeatherData | null> {
  try {
    const { lat, lng } = coordinates;

    // Access API key securely from server environment
    const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

    if (!apiKey) {
      console.error("OpenWeatherMap API key is missing");
      return null;
    }

    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&appid=${apiKey}`,
      { cache: "no-store" } // Disable caching to always get fresh data
    );

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching weather data:", error);
    return null;
  }
}
