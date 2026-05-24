import { Locale } from "@/i18n";

export const getGroundCodeLanguage = (locale: Locale) => {
  if (locale === "ko") return "korean";
  if (locale === "cn") return "chinese";
  if (locale === "ja") return "japanese";
  if (locale === "es") return "spanish";
  if (locale === "fr") return "french";
  if (locale === "de") return "german";
  if (locale === "pt") return "portuguese";
  if (locale === "id") return "indonesian";
  if (locale === "th") return "thai";
  if (locale === "vi") return "vietnamese";
  if (locale === "hi") return "hindi";
  if (locale === "ar") return "arabic";
  if (locale === "ru") return "russian";
  if (locale === "sw") return "swahili";
  if (locale === "fil") return "filipino";
  if (locale === "ha") return "hausa";
  if (locale === "bn") return "bengali";
  if (locale === "ur") return "urdu";
  if (locale === "am") return "amharic";
  return "english";
};
