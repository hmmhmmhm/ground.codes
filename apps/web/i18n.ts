export const locales = ["en", "ko", "cn"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "ko";
