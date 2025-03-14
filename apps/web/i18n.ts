import { getRequestConfig } from 'next-intl/server';

export const locales = ['en', 'ko'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'ko';

export default getRequestConfig(async ({ locale }) => {
  // Validate that the locale is actually in our list of locales
  if (!locales.includes(locale as Locale)) {
    return {
      locale: defaultLocale,
      messages: (await import(`./messages/${defaultLocale}/index.json`)).default
    };
  }
  
  return {
    locale: locale as Locale,
    messages: (await import(`./messages/${locale}/index.json`)).default
  };
});
