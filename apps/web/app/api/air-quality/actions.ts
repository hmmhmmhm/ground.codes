"use server";

import { Coordinates } from "@/components/google-map/types";

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
 * Server action to fetch air quality data from Google Maps Air Quality API
 * This keeps the API key secure on the server side
 */
export async function fetchAirQualityData(
  coordinates: Coordinates
): Promise<AirQualityData | null> {
  try {
    const { lat, lng } = coordinates;

    // Access API key securely from server environment
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_NODEJS_API_KEY;

    if (!apiKey) {
      console.error("Google Maps API key is missing");
      return null;
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
      throw new Error(`Air Quality API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching air quality data:", error);
    return null;
  }
}
