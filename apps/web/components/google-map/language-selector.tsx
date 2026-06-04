import React, { useMemo, useState } from "react";
import { locales, Locale } from "@/i18n";
import { useI18n } from "@/lib/i18n/i18n-context";
import { ChevronIcon, LanguageIcon } from "./map-control-icons";
import { LOCALE_LABELS, LOCALE_SHORT_LABELS } from "./map-control-labels";

interface LanguageSelectorProps {
  menuPositionClassName: string;
  onOpen: () => void;
  open: boolean;
}

const getSearchText = (locale: Locale) =>
  [
    locale,
    LOCALE_SHORT_LABELS[locale],
    LOCALE_LABELS[locale],
    LOCALE_LABELS[locale].normalize("NFKD").replace(/[\u0300-\u036f]/g, ""),
  ]
    .join(" ")
    .toLocaleLowerCase();

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  menuPositionClassName,
  onOpen,
  open,
}) => {
  const { t, locale, setLocale } = useI18n();
  const [query, setQuery] = useState("");
  const activeLabel = LOCALE_LABELS[locale];
  const activeShortLabel = LOCALE_SHORT_LABELS[locale];
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredLocales = useMemo(() => {
    if (!normalizedQuery) return locales;
    return locales.filter((localeOption) =>
      getSearchText(localeOption).includes(normalizedQuery),
    );
  }, [normalizedQuery]);

  const handleLanguageChange = (newLocale: Locale) => {
    setLocale(newLocale);
    setQuery("");
  };

  return (
    <div className="relative">
      <button
        onClick={onOpen}
        className="flex min-h-10 min-w-11 max-w-[calc(100vw-24px)] cursor-pointer items-center gap-2 rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white backdrop-blur-md"
        title={t("map.controls.language")}
        aria-label={`${t("map.controls.language")}: ${activeLabel}`}
        aria-expanded={open}
      >
        <LanguageIcon />
        <span className="hidden max-w-28 truncate sm:inline">
          {activeLabel}
        </span>
        <span className="rounded border border-white/15 px-1.5 py-0.5 text-[11px] leading-none text-white/80">
          {activeShortLabel}
        </span>
        <ChevronIcon />
      </button>

      {open && (
        <div
          className={`${menuPositionClassName} w-auto overflow-hidden rounded-lg border border-white/20 bg-black/45 text-white shadow-2xl backdrop-blur-md sm:w-[360px]`}
        >
          <div className="border-b border-white/10 px-3 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">
                  {activeLabel}
                </div>
                <div className="mt-0.5 text-xs text-white/70">
                  {activeShortLabel} · {locales.length} languages
                </div>
              </div>
              <span className="shrink-0 rounded-full border border-white/15 px-2 py-1 text-xs text-white/80">
                {locales.findIndex((localeOption) => localeOption === locale) +
                  1}
                /{locales.length}
              </span>
            </div>

            <label className="mt-3 block">
              <span className="sr-only">Search languages</span>
              <input
                autoComplete="off"
                className="h-9 w-full rounded-md border border-white/15 bg-black/35 px-3 text-sm text-white outline-none placeholder:text-white/45 focus:border-white/40"
                placeholder="Search languages"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
          </div>

          <div className="max-h-[min(58vh,420px)] overflow-y-auto overscroll-contain py-1">
            {filteredLocales.length > 0 ? (
              filteredLocales.map((localeOption) => (
                <button
                  key={localeOption}
                  onClick={() => handleLanguageChange(localeOption)}
                  className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-white/10 ${
                    locale === localeOption ? "bg-white/10 font-bold" : ""
                  }`}
                  aria-current={locale === localeOption ? "true" : undefined}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="w-10 shrink-0 rounded border border-white/10 px-1.5 py-0.5 text-center text-[11px] text-white/70">
                      {LOCALE_SHORT_LABELS[localeOption]}
                    </span>
                    <span className="min-w-0 truncate">
                      {LOCALE_LABELS[localeOption]}
                    </span>
                  </span>
                  {locale === localeOption && (
                    <span className="shrink-0 text-green-400">✓</span>
                  )}
                </button>
              ))
            ) : (
              <div className="px-3 py-4 text-sm text-white/70">
                No languages found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
