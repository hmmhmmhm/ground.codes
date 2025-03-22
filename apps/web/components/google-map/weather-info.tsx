import React from "react";
import { useI18n } from "@/lib/i18n/i18n-context";

interface WeatherInfoProps {
  className?: string;
}

const WeatherInfo: React.FC<WeatherInfoProps> = ({
  className = "absolute top-[10px] right-[10px]",
}) => {
  const { t } = useI18n();

  // Mock data for the weather and air quality information
  // In a real implementation, this would be fetched from a weather API
  const mockWeatherData = {
    temperature: 12,
    weatherIcon: "🌙", // Moon icon for night
    airQualityIndex: 116,
    airQualityStatus: "moderate", // good, moderate, unhealthy, etc.
  };

  return (
    <div
      className={`${className} z-10 flex flex-col items-end`}
      aria-label={t("map.weather.weatherInfo")}
    >
      <div className="bg-black/30 backdrop-blur-md border border-white/20 rounded-lg px-3 py-2 text-white flex items-center gap-2">
        <div className="flex items-center">
          <span className="text-xl mr-1">{mockWeatherData.weatherIcon}</span>
          <span className="text-xl font-semibold">
            {mockWeatherData.temperature}°
          </span>
        </div>
        <div className="flex items-center">
          <span className="text-sm">{t("map.weather.airQuality")}</span>
          <span className="ml-1 px-2 py-0.5 bg-yellow-500 rounded-full text-xs font-bold">
            {mockWeatherData.airQualityIndex}
          </span>
        </div>
      </div>
    </div>
  );
};

export default WeatherInfo;
