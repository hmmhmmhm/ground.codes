"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Locale, defaultLocale, locales } from "@/i18n";

// Message type
type Messages = Record<string, unknown>;

// Context type
interface I18nContextType {
  locale: Locale;
  messages: Messages;
  setLocale: (locale: Locale) => void;
  t: (
    key: string,
    params?: Record<string, string | number | boolean | null | undefined>,
  ) => string;
  isChangingLanguage: boolean; // Add flag to indicate language is changing
}

// Default context
const defaultContext: I18nContextType = {
  locale: defaultLocale,
  messages: {},
  setLocale: () => {},
  t: (key: string) => key,
  isChangingLanguage: false,
};

// Create context
const I18nContext = createContext<I18nContextType>(defaultContext);

// Context hook
export const useI18n = () => useContext(I18nContext);

// Get nested value from message
const getNestedValue = (obj: unknown, path: string): string => {
  const keys = path.split(".");
  const value = keys.reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }
    return path; // If key not found, return original path
  }, obj);

  return typeof value === "string" ? value : path;
};

// Check if value is a valid locale
const isValidLocale = (value: string | undefined): value is Locale => {
  if (!value) return false;
  return (locales as readonly string[]).includes(value as Locale);
};

// Get safe browser language
const getSafeBrowserLanguage = (): string => {
  try {
    // Check global object
    if (typeof window === "undefined") return "";
    if (!window.navigator) return "";

    // Check navigator.language
    const navLang = window.navigator.language;
    if (typeof navLang !== "string" || !navLang) return "";

    // Extract language code
    const langParts = navLang.split("-");
    if (!langParts || langParts.length === 0) return "";

    return langParts[0]?.toLowerCase() ?? "";
  } catch (e) {
    console.error("Error getting browser language:", e);
    return "";
  }
};

// Get browser language
const getBrowserLanguage = (): Locale => {
  try {
    // Server side rendering check
    if (typeof window === "undefined") return defaultLocale;

    // Check cookie for locale
    const cookieLocaleMatch = document.cookie
      .split("; ")
      .find((row) => row.startsWith("NEXT_LOCALE="));

    const cookieLocale = cookieLocaleMatch
      ? cookieLocaleMatch.split("=")[1]
      : undefined;

    // If valid locale found in cookie, use it
    if (cookieLocale && isValidLocale(cookieLocale as Locale)) {
      return cookieLocale as Locale;
    }

    // Check browser language
    const langCode = getSafeBrowserLanguage();

    // If Korean, handle specially (explicit Korean support)
    if (langCode === "ko") {
      return "ko" as Locale;
    }

    // If Chinese, handle specially (explicit Chinese support)
    if (langCode === "zh" || langCode === "zh-cn" || langCode === "zh-tw") {
      return "cn" as Locale;
    }

    // If valid locale found in browser, use it
    if (langCode && isValidLocale(langCode)) {
      return langCode as Locale;
    }

    // Default to English
    return "en" as Locale;
  } catch (error) {
    console.error("Error in getBrowserLanguage:", error);
    return "en" as Locale;
  }
};

// Update URL with locale
const updateUrlWithLocale = (newLocale: Locale) => {
  // URL change without locale cookie
  if (typeof window === "undefined") return;

  // Store locale in cookie
  document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
};

// Provider component
export const I18nProvider: React.FC<{
  children: React.ReactNode;
  initialLocale?: Locale;
}> = ({ children, initialLocale = defaultLocale }) => {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [messages, setMessages] = useState<Messages>({});
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);

  // Set locale and update messages and cookie
  const setLocale = async (newLocale: Locale) => {
    // If same locale, do nothing
    if (newLocale === locale) return;

    // Show refresh warning to user
    const confirmMessage =
      locale === "ko"
        ? "언어 설정을 변경하면 페이지가 새로고침되며 현재 보고 있는 내용이 초기화됩니다. 계속하시겠습니까?"
        : locale === "cn"
          ? "更改语言设置将刷新页面并重置您当前查看的内容。是否继续？"
          : locale === "ja"
            ? "言語設定を変更するとページが再読み込みされ、現在の表示がリセットされます。続行しますか？"
            : locale === "es"
              ? "Cambiar el idioma recargará la página y restablecerá la vista actual. ¿Deseas continuar?"
              : locale === "fr"
                ? "Changer la langue actualisera la page et reinitialisera la vue actuelle. Continuer ?"
                : locale === "id"
                  ? "Mengubah bahasa akan memuat ulang halaman dan mereset tampilan saat ini. Lanjutkan?"
                  : locale === "th"
                    ? "การเปลี่ยนภาษาจะโหลดหน้าใหม่และรีเซ็ตมุมมองปัจจุบัน ต้องการดำเนินการต่อหรือไม่?"
                    : locale === "vi"
                      ? "Thay đổi ngôn ngữ sẽ tải lại trang và đặt lại chế độ xem hiện tại. Bạn có muốn tiếp tục không?"
                      : locale === "hi"
                        ? "भाषा बदलने पर पेज रीफ्रेश होगा और वर्तमान दृश्य रीसेट हो जाएगा। क्या आप जारी रखना चाहते हैं?"
                        : locale === "ru"
                          ? "При смене языка страница обновится, а текущий вид будет сброшен. Продолжить?"
                          : "Changing the language will refresh the page and reset your current view. Do you want to continue?";

    const userConfirmed = window.confirm(confirmMessage);

    if (!userConfirmed) return;

    try {
      // 즉시 언어 변경 플래그 설정 - 이렇게 하면 구글맵 컴포넌트가 리렌더링되지 않음
      setIsChangingLanguage(true);

      // 약간의 지연 후 페이지 새로고침 (DOM 업데이트 시간 확보)
      setTimeout(() => {
        // 쿠키에 로케일 저장 (1년 유효)
        document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000`;

        // URL 업데이트
        updateUrlWithLocale(newLocale);
        window.location.reload();
      }, 10);
    } catch (error) {
      console.error("Failed to load messages:", error);
      setIsChangingLanguage(false); // 오류 발생 시 플래그 초기화
    }
  };

  // Translation function
  const t = (
    key: string,
    params?: Record<string, string | number | boolean | null | undefined>,
  ): string => {
    let value = getNestedValue(messages, key);

    // Parameter replacement
    if (params && typeof value === "string") {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        value = value.replace(
          new RegExp(`{${paramKey}}`, "g"),
          String(paramValue),
        );
      });
    }

    return value;
  };

  // Load initial locale
  useEffect(() => {
    const loadMessages = async () => {
      try {
        // Check cookie for locale
        const cookieLocaleMatch = document.cookie
          .split("; ")
          .find((row) => row.startsWith("NEXT_LOCALE="));

        const cookieLocale = cookieLocaleMatch
          ? cookieLocaleMatch.split("=")[1]
          : undefined;

        // Check URL for locale
        const pathParts = window.location.pathname.split("/").filter(Boolean);
        const pathLocale = pathParts.length > 0 ? pathParts[0] : undefined;

        // Check browser language
        const browserLocale = getBrowserLanguage();

        // Determine locale to use (URL > cookie > browser > default)
        let localeToUse = defaultLocale;

        if (isValidLocale(pathLocale)) {
          localeToUse = pathLocale;
        } else if (isValidLocale(cookieLocale)) {
          localeToUse = cookieLocale;
        } else if (isValidLocale(browserLocale)) {
          localeToUse = browserLocale;
        }

        // Load messages
        const loadedMessages = (
          await import(`@/messages/${localeToUse}/index.json`)
        ).default as Messages;
        setMessages(loadedMessages);
        setLocaleState(localeToUse);

        // Set cookie only if cookie doesn't exist and browser language is used
        if (!cookieLocale && localeToUse === browserLocale) {
          updateUrlWithLocale(localeToUse);
        }
        // Update URL if URL doesn't have locale
        else if (!isValidLocale(pathLocale)) {
          updateUrlWithLocale(localeToUse);
        }
      } catch (error) {
        console.error("Failed to load initial messages:", error);
      }
    };

    loadMessages();
  }, [initialLocale]);

  return (
    <I18nContext.Provider
      value={{ locale, messages, setLocale, t, isChangingLanguage }}
    >
      {children}
    </I18nContext.Provider>
  );
};
