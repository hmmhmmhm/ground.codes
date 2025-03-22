import React, { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useAirQuality } from "./hooks/use-air-quality";
import { Coordinates } from "./types";
import WeatherDetailModal from "./weather-detail-modal";

interface WeatherInfoProps {
  className?: string;
  map?: google.maps.Map | null;
}

const WeatherInfo: React.FC<WeatherInfoProps> = ({
  className = "absolute top-[10px] left-[10px]",
  map = null,
}) => {
  const { t } = useI18n();
  const [mapCenter, setMapCenter] = useState<Coordinates | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
  const {
    temperature,
    weatherIcon,
    airQuality,
    isLoading,
    error,
    weatherData,
  } = useAirQuality(mapCenter, {
    debounceMs: 1500, // Debounce map center changes to prevent excessive API calls
  });

  // Get the air quality index from the response
  const airQualityIndex = airQuality?.indexes?.[0]?.aqi || 0;
  const airQualityCategory = airQuality?.indexes?.[0]?.category || "";

  // Convert RGB object to CSS color string
  const rgbToColorString = (colorObj: any) => {
    if (!colorObj || typeof colorObj !== "object") return "#808080"; // Default gray

    // Check if it's already a hex color string
    if (typeof colorObj === "string" && colorObj.startsWith("#")) {
      return colorObj;
    }

    // Check if it has RGB components
    if ("red" in colorObj && "green" in colorObj && "blue" in colorObj) {
      // Convert 0-1 range to 0-255 range
      const r = Math.round(colorObj.red * 255);
      const g = Math.round(colorObj.green * 255);
      const b = Math.round(colorObj.blue * 255);
      return `rgb(${r}, ${g}, ${b})`;
    }

    return "#808080"; // Default gray
  };

  // Function to determine the background color for AQI
  const getAqiColor = () => {
    if (!airQuality) return "#808080"; // Default color when no data

    // Get the color from the API response
    const colorObj = airQuality.indexes?.[0]?.color;

    if (!colorObj) return "#808080";

    // Convert RGB object to CSS color string
    return rgbToColorString(colorObj);
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <div
        className={`${className} z-10 flex flex-col items-end`}
        aria-label={t("map.weather.weatherInfo")}
      >
        <div
          className="bg-black/30 backdrop-blur-md border border-white/20 rounded-lg px-3 py-2 text-white flex items-center gap-2 cursor-pointer hover:bg-black/40 transition-colors duration-200"
          onClick={handleOpenModal}
          title={t("map.weather.clickForDetails")}
        >
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
                className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold text-gray-800"
                title={airQualityCategory}
                style={{ backgroundColor: getAqiColor() }}
              >
                {airQualityIndex}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Weather Detail Modal */}
      <WeatherDetailModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        weatherData={weatherData}
        airQualityData={airQuality}
      />
    </>
  );
};

export default WeatherInfo;
