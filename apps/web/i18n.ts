// 지원되는 로케일 정의
export const locales = ['en', 'ko'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'ko';
