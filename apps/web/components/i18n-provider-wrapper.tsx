"use client";

import { useEffect, useState } from "react";
import { I18nProvider } from "@/lib/i18n/i18n-context";
import { Locale } from "@/i18n";

export default function I18nProviderWrapper({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale: Locale;
}) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return <I18nProvider initialLocale={initialLocale}>{children}</I18nProvider>;
}
