import { useCallback } from "react";
import { Locale, defaultLocale, locales } from "@/i18n";

// 로케일인지 확인하는 함수
const isValidLocale = (value: string | undefined): value is Locale => {
  if (!value) return false;
  return (locales as readonly string[]).includes(value);
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

    return langParts[0]?.toLowerCase() ?? "en";
  } catch (e) {
    console.error("Error getting browser language:", e);
    return "";
  }
};

export const useLanguage = () => {
  const getUserLanguage = useCallback(() => {
    try {
      // 서버 사이드 렌더링 확인
      if (typeof window === "undefined") return "en";

      // 쿠키에서 로케일 확인
      const cookieLocaleMatch = document.cookie
        .split("; ")
        .find((row) => row.startsWith("NEXT_LOCALE="));

      const cookieLocale = cookieLocaleMatch
        ? cookieLocaleMatch.split("=")[1]
        : undefined;

      // 쿠키에 유효한 로케일이 있으면 사용
      if (cookieLocale && cookieLocale.trim() !== "") {
        // 중국어 로케일을 구글 맵 API 형식으로 변환
        if (cookieLocale === "cn") {
          return "zh-CN";
        }
        return cookieLocale;
      }

      // 브라우저 언어 확인
      const langCode = getSafeBrowserLanguage();

      // 다른 지원 언어 확인
      if (langCode && isValidLocale(langCode)) {
        // 중국어 로케일을 구글 맵 API 형식으로 변환
        if (langCode === "cn") {
          return "zh-CN";
        }
        return langCode;
      }

      // 기본값으로 영어 사용
      return "en";
    } catch (error) {
      console.error("Error in getUserLanguage:", error);
      return "en";
    }
  }, []);

  return {
    getUserLanguage,
  };
};
