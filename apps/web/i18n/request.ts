import { getRequestConfig } from "next-intl/server";
import { locales, defaultLocale, type Locale } from "../i18n";

const isLocale = (value: string): value is Locale =>
  locales.includes(value as Locale);

export default getRequestConfig(async ({ locale }) => {
  const selectedLocale = locale && isLocale(locale) ? locale : defaultLocale;

  return {
    locale: selectedLocale,
    messages: (await import(`../messages/${selectedLocale}/index.json`))
      .default,
  };
});
