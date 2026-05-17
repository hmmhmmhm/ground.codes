import { Locale } from "@/i18n";
import { placeTypes, PlaceTypesRecord } from "./types";

/** Returns the current day index (0 = Sunday … 6 = Saturday). */
export const getCurrentDayIndex = (): number => new Date().getDay();

/**
 * Derives the weekday index from a localised day-string returned by the
 * Google Places API (e.g. "Monday: 9:00 AM – 5:00 PM", "월요일: …").
 * Returns -1 when the day cannot be determined.
 */
export const getDayIndexFromString = (dayString: string | undefined): number => {
  if (!dayString) return -1;

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const koDays = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
  const cnDays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];

  for (let i = 0; i < days.length; i++) {
    if (dayString.startsWith(days[i]!)) return i;
  }
  for (let i = 0; i < koDays.length; i++) {
    if (dayString.includes(koDays[i]!)) return i;
  }
  for (let i = 0; i < cnDays.length; i++) {
    if (dayString.includes(cnDays[i]!)) return i;
  }

  return -1;
};

/**
 * Returns true when the place is open at the current moment.
 * Works with both `periods` and `weekday_text` data from the Places API.
 */
export const isOpenNow = (
  placeDetails: google.maps.places.PlaceResult | null
): boolean => {
  try {
    if (placeDetails?.opening_hours?.periods) {
      const now = new Date();
      const day = now.getDay();
      const currentTime = now.getHours() * 60 + now.getMinutes();

      // 24-hour operation: single period with no close time
      const firstPeriod = placeDetails.opening_hours.periods[0];
      if (
        placeDetails.opening_hours.periods.length === 1 &&
        firstPeriod?.open &&
        !firstPeriod.close
      ) {
        return true;
      }

      const todayPeriods = placeDetails.opening_hours.periods.filter(
        (period) => period.open && period.open.day === day
      );

      for (const period of todayPeriods) {
        if (!period.open || !period.close) continue;

        const openTime =
          parseInt(period.open.time.substring(0, 2)) * 60 +
          parseInt(period.open.time.substring(2, 4));
        const closeTime =
          parseInt(period.close.time.substring(0, 2)) * 60 +
          parseInt(period.close.time.substring(2, 4));

        if (openTime < closeTime) {
          if (currentTime >= openTime && currentTime < closeTime) return true;
        } else {
          // Crosses midnight
          if (currentTime >= openTime || currentTime < closeTime) return true;
        }
      }
    }

    if (placeDetails?.opening_hours?.weekday_text) {
      const now = new Date();
      const currentDay = now.getDay();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      const dayText = placeDetails.opening_hours.weekday_text[currentDay];

      if (dayText) {
        if (
          dayText.includes("24 hours") ||
          dayText.includes("24시간") ||
          dayText.toLowerCase().includes("open 24 hours")
        ) {
          return true;
        }

        if (
          dayText.includes("Closed") ||
          dayText.includes("휴무") ||
          dayText.includes("休息")
        ) {
          return false;
        }

        const timePatterns = [
          /(\d{1,2}):(\d{2})\s*(AM|PM)\s*[–-]\s*(\d{1,2}):(\d{2})\s*(AM|PM)/i,
          /(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})/i,
          /(오전|오후)\s*(\d{1,2}):(\d{2})\s*[–-]\s*(오전|오후)\s*(\d{1,2}):(\d{2})/i,
        ];

        for (const pattern of timePatterns) {
          const match = dayText.match(pattern);
          if (!match) continue;

          let openHour24: number, openMinute: string | undefined;
          let closeHour24: number, closeMinute: string | undefined;

          if (pattern.source.includes("AM|PM")) {
            const [, openHour, _openMinute, openAmPm, closeHour, _closeMinute, closeAmPm] = match;
            openHour24 = parseInt(openHour!);
            if (openAmPm!.toUpperCase() === "PM" && openHour24 < 12) openHour24 += 12;
            if (openAmPm!.toUpperCase() === "AM" && openHour24 === 12) openHour24 = 0;
            closeHour24 = parseInt(closeHour!);
            if (closeAmPm!.toUpperCase() === "PM" && closeHour24 < 12) closeHour24 += 12;
            if (closeAmPm!.toUpperCase() === "AM" && closeHour24 === 12) closeHour24 = 0;
            openMinute = _openMinute;
            closeMinute = _closeMinute;
          } else if (pattern.source.includes("오전|오후")) {
            const [, openAmPm, openHour, _openMinute, closeAmPm, closeHour, _closeMinute] = match;
            openHour24 = parseInt(openHour!);
            if (openAmPm === "오후" && openHour24 < 12) openHour24 += 12;
            if (openAmPm === "오전" && openHour24 === 12) openHour24 = 0;
            closeHour24 = parseInt(closeHour!);
            if (closeAmPm === "오후" && closeHour24 < 12) closeHour24 += 12;
            if (closeAmPm === "오전" && closeHour24 === 12) closeHour24 = 0;
            openMinute = _openMinute;
            closeMinute = _closeMinute;
          } else {
            const [, openHour, _openMinute, closeHour, _closeMinute] = match;
            openHour24 = parseInt(openHour!);
            closeHour24 = parseInt(closeHour!);
            openMinute = _openMinute;
            closeMinute = _closeMinute;
          }

          const currentTime = currentHour * 60 + currentMinute;
          const openTime = openHour24 * 60 + (openMinute ? parseInt(openMinute) : 0);
          const closeTime = closeHour24 * 60 + (closeMinute ? parseInt(closeMinute) : 0);

          if (openTime < closeTime) {
            if (currentTime >= openTime && currentTime < closeTime) return true;
          } else {
            if (currentTime >= openTime || currentTime < closeTime) return true;
          }

          break;
        }
      }
    }

    return false;
  } catch (error) {
    console.error("Error checking if place is open:", error);
    return false;
  }
};

/** Returns the translated display name for a Google Places type key. */
export const getPlaceTypeName = (type: string | undefined, locale: Locale): string => {
  if (!type) return "";
  const translatedType = (placeTypes[locale] as PlaceTypesRecord)[type];
  return translatedType || type.replace(/_/g, " ");
};
