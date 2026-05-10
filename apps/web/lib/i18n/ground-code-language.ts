import { Locale } from "@/i18n";

export const getGroundCodeLanguage = (locale: Locale) => {
  if (locale === "ko") return "korean";
  if (locale === "cn") return "chinese";
  if (locale === "ja") return "japanese";
  return "english";
};
