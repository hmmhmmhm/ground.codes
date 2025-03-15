import { getRequestConfig } from 'next-intl/server';
import { locales, defaultLocale } from '../i18n';

export default getRequestConfig(async ({locale}) => {
  // 로케일이 지원되는 로케일 목록에 없으면 기본 로케일 사용
  if (!locale || !locales.includes(locale as any)) {
    locale = defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}/index.json`)).default
  };
});
