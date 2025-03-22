import { useState, useEffect, useCallback } from "react";
import { Coordinates } from "../types";
import type { 
  WeatherData, 
  AirQualityData,
  CombinedWeatherData
} from "@/app/api/weather-data/route";
import { useI18n } from "@/lib/i18n/i18n-context";

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
  const { locale } = useI18n();

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

  // Fetch combined weather and air quality data when coordinates change
  useEffect(() => {
    const fetchData = async () => {
      if (!debouncedCoordinates) return;

      setIsLoading(true);
      setError(null);

      try {
        // Fetch both air quality and weather data using the combined API endpoint
        const response = await fetch("/api/weather-data", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...debouncedCoordinates,
            language: locale, // 현재 맵의 언어 설정 전달
          }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data: CombinedWeatherData = await response.json();

        // Handle air quality data
        if (data.airQuality) {
          setAirQuality(data.airQuality);
        }

        // Handle weather data
        if (data.weather) {
          setWeatherData(data.weather);
        }

        // Handle error if both failed
        if (!data.airQuality && !data.weather) {
          setError(data.error || "Failed to fetch weather and air quality data");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch data");
        console.error("Error in useAirQuality hook:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [debouncedCoordinates, locale]); // locale 의존성 추가

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
