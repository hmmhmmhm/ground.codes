import { getRequestConfig } from "next-intl/server";
import { locales, defaultLocale } from "../i18n";

export default getRequestConfig(async ({ locale }) => {
  // If locale is not supported, use default locale
  if (!locale || !locales.includes(locale as any)) {
    locale = defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}/index.json`)).default,
  };
});
