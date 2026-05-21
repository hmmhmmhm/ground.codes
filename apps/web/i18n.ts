export const locales = [
  "en",
  "ko",
  "cn",
  "ja",
  "es",
  "fr",
  "de",
  "pt",
  "id",
] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "ko";
