"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Locale, defaultLocale, locales } from '@/i18n';

// 언어별 메시지 타입
type Messages = Record<string, any>;

// 컨텍스트 타입 정의
interface I18nContextType {
  locale: Locale;
  messages: Messages;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, any>) => string;
}

// 기본값 설정
const defaultContext: I18nContextType = {
  locale: defaultLocale,
  messages: {},
  setLocale: () => {},
  t: (key: string) => key,
};

// 컨텍스트 생성
const I18nContext = createContext<I18nContextType>(defaultContext);

// 컨텍스트 훅
export const useI18n = () => useContext(I18nContext);

// 메시지에서 중첩된 키 값 가져오기
const getNestedValue = (obj: any, path: string): string => {
  const keys = path.split('.');
  return keys.reduce((acc, key) => {
    if (acc && typeof acc === 'object' && key in acc) {
      return acc[key];
    }
    return path; // 키를 찾지 못하면 원래 경로 반환
  }, obj);
};

// 로케일인지 확인하는 함수
const isValidLocale = (value: string | undefined): value is Locale => {
  return !!value && locales.includes(value as Locale);
};

// URL 경로에서 로케일 부분 업데이트
const updateUrlWithLocale = (newLocale: Locale) => {
  // URL 변경 없이 로케일만 쿠키에 저장
  if (typeof window === 'undefined') return;
  
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

  // 로케일 변경 시 메시지 로드 및 쿠키 설정
  const setLocale = async (newLocale: Locale) => {
    try {
      // 메시지 로드
      const newMessages = (await import(`@/messages/${newLocale}/index.json`)).default;
      setMessages(newMessages);
      setLocaleState(newLocale);
      
      // 쿠키에 로케일 저장 (1년 유효)
      document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000`;
      
      // URL 업데이트
      updateUrlWithLocale(newLocale);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  // 번역 함수
  const t = (key: string, params?: Record<string, any>): string => {
    let value = getNestedValue(messages, key);
    
    // 파라미터 치환
    if (params && typeof value === 'string') {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        value = value.replace(new RegExp(`{${paramKey}}`, 'g'), String(paramValue));
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
          .split('; ')
          .find(row => row.startsWith('NEXT_LOCALE='));
        
        const cookieLocale = cookieLocaleMatch 
          ? cookieLocaleMatch.split('=')[1] 
          : undefined;
        
        // URL에서 로케일 확인
        const pathParts = window.location.pathname.split('/').filter(Boolean);
        const pathLocale = pathParts.length > 0 ? pathParts[0] : undefined;
        
        // 사용할 로케일 결정 (URL > 쿠키 > 기본값)
        let localeToUse = initialLocale;
        
        if (isValidLocale(pathLocale)) {
          localeToUse = pathLocale;
        } else if (isValidLocale(cookieLocale)) {
          localeToUse = cookieLocale;
        }
        
        // 메시지 로드
        const loadedMessages = (await import(`@/messages/${localeToUse}/index.json`)).default;
        setMessages(loadedMessages);
        setLocaleState(localeToUse);
        
        // URL 업데이트 (URL에 로케일이 없는 경우)
        if (!isValidLocale(pathLocale)) {
          updateUrlWithLocale(localeToUse);
        }
      } catch (error) {
        console.error('Failed to load initial messages:', error);
      }
    };
    
    loadMessages();
  }, [initialLocale]);

  return (
    <I18nContext.Provider value={{ locale, messages, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
};
