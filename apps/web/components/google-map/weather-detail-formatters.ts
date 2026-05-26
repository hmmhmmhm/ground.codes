type Translate = (key: string) => string;

export function formatWeatherDate(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("default", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function getWeatherIconUrl(iconCode: string) {
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}

export function getWindDescription(speed: number, t: Translate) {
  let beaufort = 0;
  if (speed < 0.3) beaufort = 0;
  else if (speed < 1.6) beaufort = 1;
  else if (speed < 3.4) beaufort = 2;
  else if (speed < 5.5) beaufort = 3;
  else if (speed < 8.0) beaufort = 4;
  else if (speed < 10.8) beaufort = 5;
  else if (speed < 13.9) beaufort = 6;
  else if (speed < 17.2) beaufort = 7;
  else if (speed < 20.8) beaufort = 8;
  else if (speed < 24.5) beaufort = 9;
  else if (speed < 28.5) beaufort = 10;
  else if (speed < 32.7) beaufort = 11;
  else beaufort = 12;

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
}

export function getWindDirection(degrees: number, t: Translate) {
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
}

export function formatConcentrationUnit(unit: string) {
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
}

export function rgbToColorString(colorObj: unknown) {
  if (typeof colorObj === "string" && colorObj.startsWith("#")) {
    return colorObj;
  }

  if (!colorObj || typeof colorObj !== "object") return "#808080";

  if ("red" in colorObj && "green" in colorObj && "blue" in colorObj) {
    const rgb = colorObj as { red: number; green: number; blue: number };
    const r = Math.round(rgb.red * 255);
    const g = Math.round(rgb.green * 255);
    const b = Math.round(rgb.blue * 255);
    return `rgb(${r}, ${g}, ${b})`;
  }

  return "#808080";
}

export function getAirQualityBackgroundClass(category: string) {
  const normalizedCategory = category.toLowerCase();

  if (normalizedCategory.includes("good")) {
    return "bg-green-50 dark:bg-green-900/30";
  }
  if (normalizedCategory.includes("moderate")) {
    return "bg-yellow-50 dark:bg-yellow-900/30";
  }
  if (
    normalizedCategory.includes("unhealthy") &&
    normalizedCategory.includes("sensitive")
  ) {
    return "bg-orange-50 dark:bg-orange-900/30";
  }
  if (normalizedCategory.includes("unhealthy")) {
    return "bg-red-50 dark:bg-red-900/30";
  }
  if (
    normalizedCategory.includes("very") ||
    normalizedCategory.includes("hazardous")
  ) {
    return "bg-purple-50 dark:bg-purple-900/30";
  }

  return "bg-gray-100 dark:bg-gray-700";
}

export function getHealthRecommendationLabel(key: string, t: Translate) {
  const labels: Record<string, string> = {
    generalPopulation: t("airQuality.generalPopulation"),
    children: t("airQuality.children"),
    elderly: t("airQuality.elderly"),
    sportsAndRecreation: t("airQuality.sportsAndRecreation"),
    lungDiseasePopulation: t("airQuality.lungDiseasePopulation"),
    heartDiseasePopulation: t("airQuality.heartDiseasePopulation"),
    athletes: t("airQuality.athletes"),
    pregnantWomen: t("airQuality.pregnantWomen"),
  };

  return labels[key] ?? key;
}
