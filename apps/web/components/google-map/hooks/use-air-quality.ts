import { useState, useEffect, useCallback } from "react";
import { Coordinates } from "../types";
import type { WeatherData } from "@/app/api/weather/route";
import type { AirQualityData } from "@/app/api/air-quality/route";

// Simple debounce function implementation
const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
};

interface UseAirQualityOptions {
  debounceMs?: number;
}

/**
 * Custom hook to fetch air quality data for a given location
 */
export const useAirQuality = (
  coordinates: Coordinates | null,
  options: UseAirQualityOptions = {}
) => {
  const { debounceMs = 1000 } = options;

  const [airQuality, setAirQuality] = useState<AirQualityData | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce coordinates to avoid excessive API calls
  const debouncedCoordinates = useDebounce(coordinates, debounceMs);

  // Function to get weather icon based on weather condition
  const getWeatherIcon = useCallback((weatherId: number): string => {
    // Map weather condition codes to emoji icons
    if (weatherId >= 200 && weatherId < 300) return "⛈️"; // Thunderstorm
    if (weatherId >= 300 && weatherId < 400) return "🌧️"; // Drizzle
    if (weatherId >= 500 && weatherId < 600) return "🌧️"; // Rain
    if (weatherId >= 600 && weatherId < 700) return "❄️"; // Snow
    if (weatherId >= 700 && weatherId < 800) return "🌫️"; // Atmosphere (fog, mist, etc.)
    if (weatherId === 800) return "☀️"; // Clear sky
    if (weatherId > 800 && weatherId < 900) return "☁️"; // Clouds
    return "🌡️"; // Default
  }, []);

  // Fetch air quality and weather data when coordinates change
  useEffect(() => {
    const fetchData = async () => {
      if (!debouncedCoordinates) return;

      setIsLoading(true);
      setError(null);

      try {
        // Fetch both air quality and weather data using API endpoints
        const [airQualityData, weatherDataResult] = await Promise.allSettled([
          fetch("/api/air-quality", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(debouncedCoordinates),
          }).then((res) => {
            if (!res.ok)
              throw new Error(`Air quality API error: ${res.status}`);
            return res.json();
          }),
          fetch("/api/weather", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(debouncedCoordinates),
          }).then((res) => {
            if (!res.ok) throw new Error(`Weather API error: ${res.status}`);
            return res.json();
          }),
        ]);

        // Handle air quality data
        if (airQualityData.status === "fulfilled" && airQualityData.value) {
          setAirQuality(airQualityData.value);
        } else if (airQualityData.status === "rejected") {
          console.error(
            "Air quality data fetch failed:",
            airQualityData.reason
          );
          setError("Failed to fetch air quality data");
        }

        // Handle weather data
        if (
          weatherDataResult.status === "fulfilled" &&
          weatherDataResult.value
        ) {
          setWeatherData(weatherDataResult.value);
        } else if (weatherDataResult.status === "rejected") {
          console.error("Weather data fetch failed:", weatherDataResult.reason);
          // Don't set error for weather failure if air quality succeeded
          if (airQualityData.status !== "fulfilled") {
            setError("Failed to fetch weather data");
          }
        }

        // If both failed, set a general error
        if (
          airQualityData.status !== "fulfilled" &&
          weatherDataResult.status !== "fulfilled"
        ) {
          setError("Failed to fetch weather and air quality data");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch data");
        console.error("Error in useAirQuality hook:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [debouncedCoordinates]);

  // Calculate temperature and weather icon
  const temperature =
    weatherData && weatherData.main && weatherData.main.temp
      ? Math.round(weatherData.main.temp)
      : null;
  const weatherIcon =
    weatherData && weatherData.weather && weatherData.weather[0]
      ? getWeatherIcon(weatherData.weather[0].id)
      : "🌡️";

  return {
    airQuality,
    temperature,
    weatherIcon,
    isLoading,
    error,
    weatherData,
  };
};
