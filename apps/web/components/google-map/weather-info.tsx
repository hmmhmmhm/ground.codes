import React, { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useAirQuality } from "./hooks/use-air-quality";
import { Coordinates } from "./types";

interface WeatherInfoProps {
  className?: string;
  map?: google.maps.Map | null;
}

const WeatherInfo: React.FC<WeatherInfoProps> = ({
  className = "absolute top-[10px] right-[10px]",
  map = null,
}) => {
  const { t } = useI18n();
  const [mapCenter, setMapCenter] = useState<Coordinates | null>(null);

  // Update map center when the map moves
  useEffect(() => {
    if (!map) return;

    // Get initial center
    setMapCenter({
      lat: map.getCenter()?.lat() || 0,
      lng: map.getCenter()?.lng() || 0,
    });

    // Add listener for center changes
    const centerChangedListener = map.addListener("center_changed", () => {
      setMapCenter({
        lat: map.getCenter()?.lat() || 0,
        lng: map.getCenter()?.lng() || 0,
      });
    });

    // Clean up listener on unmount
    return () => {
      if (centerChangedListener) {
        google.maps.event.removeListener(centerChangedListener);
      }
    };
  }, [map]);

  // Use the air quality hook to fetch real-time air quality data
  const { temperature, weatherIcon, airQuality, isLoading, error } =
    useAirQuality(mapCenter, {
      debounceMs: 1500, // Debounce map center changes to prevent excessive API calls
    });

  // Get the air quality index from the response
  const airQualityIndex = airQuality?.indexes?.[0]?.aqi || 0;
  const airQualityCategory = airQuality?.indexes?.[0]?.category || "";

  // Function to determine the background color class based on AQI category
  const getAqiColorClass = () => {
    if (!airQuality) return "bg-gray-500"; // Default color when no data

    // Get the color from the API response
    const color = airQuality.indexes?.[0]?.color;

    if (!color) return "bg-gray-500";

    // Determine the color class based on the category
    switch (airQualityCategory.toLowerCase().split(" ")[0]) {
      case "good":
        return "bg-green-500";
      case "moderate":
        return "bg-yellow-500";
      case "unhealthy":
        return airQualityCategory.includes("sensitive")
          ? "bg-orange-500"
          : "bg-red-500";
      case "very":
        return "bg-purple-500";
      case "hazardous":
        return "bg-red-900";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div
      className={`${className} z-10 flex flex-col items-end`}
      aria-label={t("map.weather.weatherInfo")}
    >
      <div className="bg-black/30 backdrop-blur-md border border-white/20 rounded-lg px-3 py-2 text-white flex items-center gap-2">
        <div className="flex items-center">
          <span className="text-xl mr-1">{weatherIcon}</span>
          <span className="text-xl font-semibold">{temperature}°</span>
        </div>
        <div className="flex items-center">
          <span className="text-sm">{t("map.weather.airQuality")}</span>
          {isLoading ? (
            <span className="ml-1 px-2 py-0.5 bg-gray-500 rounded-full text-xs font-bold animate-pulse">
              ...
            </span>
          ) : error ? (
            <span
              className="ml-1 px-2 py-0.5 bg-red-500 rounded-full text-xs font-bold"
              title={error}
            >
              !
            </span>
          ) : (
            <span
              className={`ml-1 px-2 py-0.5 ${getAqiColorClass()} rounded-full text-xs font-bold`}
              title={airQualityCategory}
            >
              {airQualityIndex}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default WeatherInfo;
