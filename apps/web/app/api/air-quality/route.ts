import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

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

/**
 * API route to fetch air quality data from Google Maps Air Quality API
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
    const apiKey = process.env.GOOGLE_MAPS_NODEJS_API_KEY;

    if (!apiKey) {
      console.error("Google Maps API key is missing");
      return NextResponse.json(
        { error: "API configuration error" },
        { status: 500 }
      );
    }

    const response = await fetch(
      `https://airquality.googleapis.com/v1/currentConditions:lookup?key=${apiKey}`,
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
          languageCode: "en", // Default to English on server side
        }),
        cache: "no-store", // Disable caching to always get fresh data
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: `Air Quality API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching air quality data:", error);
    return NextResponse.json(
      { error: "Failed to fetch air quality data" },
      { status: 500 }
    );
  }
}
