import { useCallback } from "react";
import { Locale, locales } from "@/i18n";

// Check if a value is a valid locale
const isValidLocale = (value: string | undefined): value is Locale => {
  if (!value) return false;
  return (locales as readonly string[]).includes(value);
};

// Safely get browser language
const getSafeBrowserLanguage = (): string => {
  try {
    // Check global object
    if (typeof window === "undefined") return "";
    if (!window.navigator) return "";

    // Check navigator.language property
    const navLang = window.navigator.language;
    if (typeof navLang !== "string" || !navLang) return "";

    // Extract language code
    const langParts = navLang.split("-");
    if (!langParts || langParts.length === 0) return "";

    return langParts[0]?.toLowerCase() ?? "en";
  } catch (e) {
    console.error("Error getting browser language:", e);
    return "";
  }
};

export const useLanguage = () => {
  const getUserLanguage = useCallback(() => {
    try {
      // Check server-side rendering
      if (typeof window === "undefined") return "en";

      // Check cookie for locale
      const cookieLocaleMatch = document.cookie
        .split("; ")
        .find((row) => row.startsWith("NEXT_LOCALE="));

      const cookieLocale = cookieLocaleMatch
        ? cookieLocaleMatch.split("=")[1]
        : undefined;

      // Use valid locale from cookie
      if (cookieLocale && cookieLocale.trim() !== "") {
        // Convert Chinese locale to Google Maps API format
        if (cookieLocale === "cn") {
          return "zh-CN";
        }
        return cookieLocale;
      }

      // Check browser language
      const langCode = getSafeBrowserLanguage();

      // Check other supported languages
      if (langCode && isValidLocale(langCode)) {
        // Convert Chinese locale to Google Maps API format
        if (langCode === "cn") {
          return "zh-CN";
        }
        if (langCode === "ja") {
          return "ja";
        }
        return langCode;
      }

      // Default to English
      return "en";
    } catch (error) {
      console.error("Error in getUserLanguage:", error);
      return "en";
    }
  }, []);

  return {
    getUserLanguage,
  };
};
