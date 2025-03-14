import React from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { locales, Locale } from '@/i18n';

const LanguageSelector: React.FC = () => {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();

  const handleLanguageChange = (locale: Locale) => {
    // Get the current path without the locale prefix
    const pathWithoutLocale = pathname.split('/').slice(2).join('/');
    // Navigate to the same path but with the new locale
    router.push(`/${locale}/${pathWithoutLocale}`);
  };

  return (
    <div className="absolute bottom-[100px] right-[10px] bg-white border-none rounded-md shadow-md cursor-pointer z-10">
      <div className="flex flex-col">
        {locales.map((locale) => (
          <button
            key={locale}
            onClick={() => handleLanguageChange(locale)}
            className="px-3 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
            title={t('common.languageName', { locale })}
          >
            <span className="text-[#1A73E8]">
              {locale === 'en' ? 'English' : '한국어'}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSelector;
