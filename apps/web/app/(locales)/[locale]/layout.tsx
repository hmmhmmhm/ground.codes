import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import { getMessages } from "next-intl/server";
import { locales } from "@/i18n";
import { I18nProvider } from "@/lib/i18n/i18n-context";
import { Metadata, Viewport } from "next";
import { Space_Mono } from "next/font/google";
import "@repo/ui/globals.css";
import "../../globals.css";

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: any;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "Ground Codes",
    description: "Ground code come to exact earth (+mars) address",
  };
}

export const viewport: Viewport = {
  themeColor: "#212121",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: any;
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  // Await the params to get the locale
  const { locale } = await params;

  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) notFound();

  const messages = await getMessages({ locale });

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <I18nProvider initialLocale={locale as any}>{children}</I18nProvider>
    </NextIntlClientProvider>
  );
}
