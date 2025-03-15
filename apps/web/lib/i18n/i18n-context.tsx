"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Locale, defaultLocale, locales } from "@/i18n";

// 언어별 메시지 타입
type Messages = Record<string, any>;

// 컨텍스트 타입 정의
interface I18nContextType {
  locale: Locale;
  messages: Messages;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, any>) => string;
  isChangingLanguage: boolean; // Add flag to indicate language is changing
}

// 기본값 설정
const defaultContext: I18nContextType = {
  locale: defaultLocale,
  messages: {},
  setLocale: () => {},
  t: (key: string) => key,
  isChangingLanguage: false,
};

// 컨텍스트 생성
const I18nContext = createContext<I18nContextType>(defaultContext);

// 컨텍스트 훅
export const useI18n = () => useContext(I18nContext);

// 메시지에서 중첩된 키 값 가져오기
const getNestedValue = (obj: any, path: string): string => {
  const keys = path.split(".");
  return keys.reduce((acc, key) => {
    if (acc && typeof acc === "object" && key in acc) {
      return acc[key];
    }
    return path; // 키를 찾지 못하면 원래 경로 반환
  }, obj);
};

// 로케일인지 확인하는 함수
const isValidLocale = (value: string | undefined): value is Locale => {
  if (!value) return false;
  return (locales as readonly string[]).includes(value as Locale);
};

// 안전하게 브라우저 언어 가져오기
const getSafeBrowserLanguage = (): string => {
  try {
    // 전역 객체 확인
    if (typeof window === "undefined") return "";
    if (!window.navigator) return "";

    // navigator.language 속성 확인
    const navLang = window.navigator.language;
    if (typeof navLang !== "string" || !navLang) return "";

    // 언어 코드 추출
    const langParts = navLang.split("-");
    if (!langParts || langParts.length === 0) return "";

    return langParts[0]?.toLowerCase() ?? "";
  } catch (e) {
    console.error("Error getting browser language:", e);
    return "";
  }
};

// 브라우저 언어 가져오기
const getBrowserLanguage = (): Locale => {
  try {
    // 서버 사이드 렌더링 확인
    if (typeof window === "undefined") return defaultLocale;

    // 쿠키에서 로케일 확인
    const cookieLocaleMatch = document.cookie
      .split("; ")
      .find((row) => row.startsWith("NEXT_LOCALE="));

    const cookieLocale = cookieLocaleMatch
      ? cookieLocaleMatch.split("=")[1]
      : undefined;

    // 쿠키에 유효한 로케일이 있으면 사용
    if (cookieLocale && isValidLocale(cookieLocale as Locale)) {
      return cookieLocale as Locale;
    }

    // 브라우저 언어 확인
    const langCode = getSafeBrowserLanguage();

    // 한국어인 경우 특별히 처리 (명시적으로 한국어 지원)
    if (langCode === "ko") {
      return "ko" as Locale;
    }

    // 다른 지원 언어 확인
    if (langCode && isValidLocale(langCode)) {
      return langCode as Locale;
    }

    // 기본값으로 영어 사용
    return "en" as Locale;
  } catch (error) {
    console.error("Error in getBrowserLanguage:", error);
    return "en" as Locale;
  }
};

// URL 경로에서 로케일 부분 업데이트
const updateUrlWithLocale = (newLocale: Locale) => {
  // URL 변경 없이 로케일만 쿠키에 저장
  if (typeof window === "undefined") return;

  // 쿠키에 로케일 저장
  document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
};

// 프로바이더 컴포넌트
export const I18nProvider: React.FC<{
  children: React.ReactNode;
  initialLocale?: Locale;
}> = ({ children, initialLocale = defaultLocale }) => {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [messages, setMessages] = useState<Messages>({});
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);

  // 로케일 변경 시 메시지 로드 및 쿠키 설정
  const setLocale = async (newLocale: Locale) => {
    // 이미 같은 로케일이면 변경하지 않음
    if (newLocale === locale) return;

    // 사용자에게 새로고침 경고 표시
    const confirmMessage =
      locale === "ko"
        ? "언어 설정을 변경하면 페이지가 새로고침되며 현재 보고 있는 내용이 초기화됩니다. 계속하시겠습니까?"
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

  // 번역 함수
  const t = (key: string, params?: Record<string, any>): string => {
    let value = getNestedValue(messages, key);

    // 파라미터 치환
    if (params && typeof value === "string") {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        value = value.replace(
          new RegExp(`{${paramKey}}`, "g"),
          String(paramValue)
        );
      });
    }

    return value;
  };

  // 초기 로케일 로드
  useEffect(() => {
    const loadMessages = async () => {
      try {
        // 쿠키에서 로케일 확인
        const cookieLocaleMatch = document.cookie
          .split("; ")
          .find((row) => row.startsWith("NEXT_LOCALE="));

        const cookieLocale = cookieLocaleMatch
          ? cookieLocaleMatch.split("=")[1]
          : undefined;

        // URL에서 로케일 확인
        const pathParts = window.location.pathname.split("/").filter(Boolean);
        const pathLocale = pathParts.length > 0 ? pathParts[0] : undefined;

        // 브라우저 언어 확인
        const browserLocale = getBrowserLanguage();

        // 사용할 로케일 결정 (URL > 쿠키 > 브라우저 > 기본값)
        let localeToUse = defaultLocale;

        if (isValidLocale(pathLocale)) {
          localeToUse = pathLocale;
        } else if (isValidLocale(cookieLocale)) {
          localeToUse = cookieLocale;
        } else if (isValidLocale(browserLocale)) {
          localeToUse = browserLocale;
        }

        // 메시지 로드
        const loadedMessages = (
          await import(`@/messages/${localeToUse}/index.json`)
        ).default;
        setMessages(loadedMessages);
        setLocaleState(localeToUse);

        // 쿠키가 없고 브라우저 언어를 사용한 경우에만 쿠키 설정
        if (!cookieLocale && localeToUse === browserLocale) {
          updateUrlWithLocale(localeToUse);
        }
        // URL 업데이트 (URL에 로케일이 없는 경우)
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
