import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";
export const maxDuration = 8000;
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
 * API route to fetch weather data from OpenWeatherMap API
 * This keeps the API key secure on the server side
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lat, lng } = body;

    if (!lat || !lng) {
      return NextResponse.json(
        { error: "Latitude and longitude are required" },
        { status: 400 }
      );
    }

    // Access API key securely from server environment
    const apiKey = process.env.OPENWEATHER_API_KEY;

    if (!apiKey) {
      console.error("OpenWeatherMap API key is missing");
      return NextResponse.json(
        { error: "API configuration error" },
        { status: 500 }
      );
    }

    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&units=metric&appid=${apiKey}`
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: `Weather API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching weather data:", error);
    return NextResponse.json(
      { error: "Failed to fetch weather data" },
      { status: 500 }
    );
  }
}
