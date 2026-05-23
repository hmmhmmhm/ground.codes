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
  "th",
  "vi",
  "hi",
  "ar",
] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "ko";
