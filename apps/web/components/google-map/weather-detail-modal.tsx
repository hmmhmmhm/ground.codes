import React, { useRef, useEffect } from "react";
import Image from "next/image";
import { useI18n } from "@/lib/i18n/i18n-context";
import { AirQualityData, WeatherData } from "@/app/api/weather-data/route";

interface WeatherDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  weatherData: WeatherData | null;
  airQualityData: AirQualityData | null;
}

const WeatherDetailModal: React.FC<WeatherDetailModalProps> = ({
  isOpen,
  onClose,
  weatherData,
  airQualityData,
}) => {
  const { t } = useI18n();
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Format date and time
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("default", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Get weather icon URL from OpenWeatherMap
  const getWeatherIconUrl = (iconCode: string) => {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  };

  // Convert wind speed to beaufort scale and get description
  const getWindDescription = (speed: number) => {
    // Beaufort scale conversion (m/s to beaufort)
    let beaufort = 0;
    if (speed < 0.3)
      beaufort = 0; // Calm
    else if (speed < 1.6)
      beaufort = 1; // Light air
    else if (speed < 3.4)
      beaufort = 2; // Light breeze
    else if (speed < 5.5)
      beaufort = 3; // Gentle breeze
    else if (speed < 8.0)
      beaufort = 4; // Moderate breeze
    else if (speed < 10.8)
      beaufort = 5; // Fresh breeze
    else if (speed < 13.9)
      beaufort = 6; // Strong breeze
    else if (speed < 17.2)
      beaufort = 7; // High wind
    else if (speed < 20.8)
      beaufort = 8; // Gale
    else if (speed < 24.5)
      beaufort = 9; // Strong gale
    else if (speed < 28.5)
      beaufort = 10; // Storm
    else if (speed < 32.7)
      beaufort = 11; // Violent storm
    else beaufort = 12; // Hurricane

    const descriptions = [
      t("weather.wind.calm"),
      t("weather.wind.lightAir"),
      t("weather.wind.lightBreeze"),
      t("weather.wind.gentleBreeze"),
      t("weather.wind.moderateBreeze"),
      t("weather.wind.freshBreeze"),
      t("weather.wind.strongBreeze"),
      t("weather.wind.highWind"),
      t("weather.wind.gale"),
      t("weather.wind.strongGale"),
      t("weather.wind.storm"),
      t("weather.wind.violentStorm"),
      t("weather.wind.hurricane"),
    ];

    return `${descriptions[beaufort]} (${beaufort})`;
  };

  // Get wind direction from degrees
  const getWindDirection = (degrees: number) => {
    const directions = [
      t("weather.direction.n"),
      t("weather.direction.nne"),
      t("weather.direction.ne"),
      t("weather.direction.ene"),
      t("weather.direction.e"),
      t("weather.direction.ese"),
      t("weather.direction.se"),
      t("weather.direction.sse"),
      t("weather.direction.s"),
      t("weather.direction.ssw"),
      t("weather.direction.sw"),
      t("weather.direction.wsw"),
      t("weather.direction.w"),
      t("weather.direction.wnw"),
      t("weather.direction.nw"),
      t("weather.direction.nnw"),
    ];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  };

  // Convert concentration units to proper symbols
  const formatConcentrationUnit = (unit: string) => {
    switch (unit) {
      case "PARTS_PER_BILLION":
        return "ppb";
      case "PARTS_PER_MILLION":
        return "ppm";
      case "MICROGRAMS_PER_CUBIC_METER":
        return "μg/m³";
      case "MILLIGRAMS_PER_CUBIC_METER":
        return "mg/m³";
      default:
        return unit;
    }
  };

  // Convert RGB object to CSS color string
  const rgbToColorString = (colorObj: unknown) => {
    if (typeof colorObj === "string" && colorObj.startsWith("#")) {
      return colorObj;
    }

    if (!colorObj || typeof colorObj !== "object") return "#808080"; // Default gray

    // Check if it has RGB components
    if ("red" in colorObj && "green" in colorObj && "blue" in colorObj) {
      const rgb = colorObj as { red: number; green: number; blue: number };
      // Convert 0-1 range to 0-255 range
      const r = Math.round(rgb.red * 255);
      const g = Math.round(rgb.green * 255);
      const b = Math.round(rgb.blue * 255);
      return `rgb(${r}, ${g}, ${b})`;
    }

    return "#808080"; // Default gray
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div
        ref={modalRef}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg bg-white dark:bg-gray-800 shadow-xl p-6 m-4"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          aria-label={t("common.close")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
          {t("weather.detailedInfo")}
        </h2>

        {/* Weather Data Section */}
        {weatherData ? (
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                {weatherData.name || t("weather.currentLocation")}
              </h3>
              {weatherData.weather && weatherData.weather[0] && (
                <Image
                  unoptimized
                  src={getWeatherIconUrl(weatherData.weather[0].icon)}
                  alt={weatherData.weather[0].description}
                  width={48}
                  height={48}
                  className="ml-2 h-12 w-12"
                />
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Temperature Section */}
              <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-3">
                  {t("weather.temperature")}
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t("weather.current")}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {Math.round(weatherData.main.temp)}°C
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t("weather.feelsLike")}
                    </p>
                    <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                      {Math.round(weatherData.main.feels_like)}°C
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t("weather.min")}
                    </p>
                    <p className="text-gray-800 dark:text-gray-200">
                      {Math.round(weatherData.main.temp_min)}°C
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t("weather.max")}
                    </p>
                    <p className="text-gray-800 dark:text-gray-200">
                      {Math.round(weatherData.main.temp_max)}°C
                    </p>
                  </div>
                </div>
              </div>

              {/* Weather Conditions Section */}
              <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-lg p-4">
                <h4 className="font-medium text-indigo-800 dark:text-indigo-200 mb-3">
                  {t("weather.conditions")}
                </h4>
                {weatherData.weather && weatherData.weather[0] && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t("weather.mainCondition")}
                    </p>
                    <p className="text-lg font-semibold text-gray-800 dark:text-gray-200 capitalize mb-2">
                      {weatherData.weather[0].main &&
                        t(
                          `weather.mainTypes.${weatherData.weather[0].main.toLowerCase()}`
                        )}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t("weather.description")}
                    </p>
                    <p className="text-gray-800 dark:text-gray-200 capitalize">
                      {weatherData.weather[0].description}
                    </p>
                  </div>
                )}
              </div>

              {/* Atmospheric Section */}
              <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4">
                <h4 className="font-medium text-green-800 dark:text-green-200 mb-3">
                  {t("weather.atmospheric")}
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t("weather.humidity")}
                    </p>
                    <p className="text-gray-800 dark:text-gray-200">
                      {weatherData.main.humidity}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t("weather.pressure")}
                    </p>
                    <p className="text-gray-800 dark:text-gray-200">
                      {weatherData.main.pressure} hPa
                    </p>
                  </div>
                </div>
              </div>

              {/* Wind Section */}
              <div className="bg-amber-50 dark:bg-amber-900/30 rounded-lg p-4">
                <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-3">
                  {t("weather.wind.title")}
                </h4>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t("weather.wind.speed")}
                    </p>
                    <p className="text-gray-800 dark:text-gray-200">
                      {weatherData.wind?.speed} m/s
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t("weather.description")}
                    </p>
                    <p className="text-gray-800 dark:text-gray-200">
                      {getWindDescription(weatherData.wind?.speed)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t("weather.wind.direction")}
                    </p>
                    <p className="text-gray-800 dark:text-gray-200">
                      {getWindDirection(weatherData.wind?.deg)} (
                      {weatherData.wind?.deg}°)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg mb-6">
            <p className="text-gray-600 dark:text-gray-300">
              {t("weather.noWeatherData")}
            </p>
          </div>
        )}

        {/* Air Quality Data Section */}
        {airQualityData ? (
          <div>
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
              {t("airQuality.title")}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {t("airQuality.updatedAt")}: {formatDate(airQualityData.dateTime)}
            </p>

            {/* AQI Index */}
            {airQualityData.indexes && airQualityData.indexes.length > 0 && (
              <div className="mb-6">
                <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-2">
                  {t("airQuality.indexes")}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {airQualityData.indexes.map((index) => {
                    // Determine background color based on category
                    let bgColorClass = "bg-gray-100 dark:bg-gray-700";
                    if (index.category.toLowerCase().includes("good")) {
                      bgColorClass = "bg-green-50 dark:bg-green-900/30";
                    } else if (
                      index.category.toLowerCase().includes("moderate")
                    ) {
                      bgColorClass = "bg-yellow-50 dark:bg-yellow-900/30";
                    } else if (
                      index.category.toLowerCase().includes("unhealthy") &&
                      index.category.toLowerCase().includes("sensitive")
                    ) {
                      bgColorClass = "bg-orange-50 dark:bg-orange-900/30";
                    } else if (
                      index.category.toLowerCase().includes("unhealthy")
                    ) {
                      bgColorClass = "bg-red-50 dark:bg-red-900/30";
                    } else if (
                      index.category.toLowerCase().includes("very") ||
                      index.category.toLowerCase().includes("hazardous")
                    ) {
                      bgColorClass = "bg-purple-50 dark:bg-purple-900/30";
                    }

                    return (
                      <div
                        key={index.code}
                        className={`${bgColorClass} rounded-lg p-4`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <h5 className="font-bold">{index.displayName}</h5>
                          <span
                            className="px-2 py-1 rounded text-gray-800 text-sm font-bold"
                            style={{
                              backgroundColor: rgbToColorString(index.color),
                            }}
                          >
                            {index.aqi}
                          </span>
                        </div>
                        <p className="text-sm">{index.category}</p>
                        {index.dominantPollutant && (
                          <p className="text-xs mt-1 text-gray-600 dark:text-gray-400">
                            {t("airQuality.dominantPollutant")}:{" "}
                            {index.dominantPollutant}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Pollutants */}
            {airQualityData.pollutants &&
              airQualityData.pollutants.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-2">
                    {t("airQuality.pollutants")}
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {t("airQuality.pollutant")}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {t("airQuality.fullName")}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {t("airQuality.concentration")}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                        {airQualityData.pollutants.map((pollutant) => (
                          <tr key={pollutant.code}>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                              {pollutant.displayName}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                              {pollutant.fullName}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                              {pollutant.concentration.value}{" "}
                              {formatConcentrationUnit(
                                pollutant.concentration.units
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            {/* Health Recommendations */}
            {airQualityData.healthRecommendations && (
              <div>
                <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-2">
                  {t("airQuality.healthRecommendations")}
                </h4>
                <div className="space-y-3 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  {Object.entries(airQualityData.healthRecommendations).map(
                    ([key, value]) => (
                      <div key={key}>
                        <h5 className="text-sm font-bold text-gray-700 dark:text-gray-300 capitalize">
                          {key === "generalPopulation"
                            ? t("airQuality.generalPopulation")
                            : key === "children"
                              ? t("airQuality.children")
                              : key === "elderly"
                                ? t("airQuality.elderly")
                                : key === "sportsAndRecreation"
                                  ? t("airQuality.sportsAndRecreation")
                                  : key === "lungDiseasePopulation"
                                    ? t("airQuality.lungDiseasePopulation")
                                    : key === "heartDiseasePopulation"
                                      ? t("airQuality.heartDiseasePopulation")
                                      : key === "athletes"
                                        ? t("airQuality.athletes")
                                        : key === "pregnantWomen"
                                          ? t("airQuality.pregnantWomen")
                                          : key}
                        </h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {value}
                        </p>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <p className="text-gray-600 dark:text-gray-300">
              {t("airQuality.noAirQualityData")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeatherDetailModal;
