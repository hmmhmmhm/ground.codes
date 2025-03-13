import { useCallback } from 'react';

export const useLanguage = () => {
  const getUserLanguage = useCallback(() => {
    if (typeof window !== "undefined") {
      return window.navigator.language || "en";
    }
    return "en";
  }, []);

  return {
    getUserLanguage
  };
};
